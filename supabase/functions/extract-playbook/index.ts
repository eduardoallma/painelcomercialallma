import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { playbook_id } = await req.json();
    if (!playbook_id) throw new Error("playbook_id is required");

    // Get playbook record
    const { data: playbook, error: pbError } = await supabase
      .from("playbooks")
      .select("id, file_path, owner_id")
      .eq("id", playbook_id)
      .single();

    if (pbError || !playbook) throw new Error("Playbook not found");
    if (playbook.owner_id !== user.id) throw new Error("Unauthorized");

    // Download file from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("playbooks")
      .download(playbook.file_path);

    if (dlError || !fileData) throw new Error("Failed to download file");

    let extractedText = "";
    const fileName = playbook.file_path.toLowerCase();

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      extractedText = await fileData.text();
    } else if (fileName.endsWith(".pdf")) {
      // For PDF, extract raw text content (basic approach)
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      extractedText = extractTextFromPdfBytes(bytes);
    } else if (fileName.endsWith(".docx")) {
      // For DOCX, extract text from XML content
      extractedText = await extractTextFromDocx(fileData);
    } else {
      // Fallback: try to read as text
      extractedText = await fileData.text();
    }

    // Update playbook with extracted text
    const { error: updateError } = await supabase
      .from("playbooks")
      .update({ extracted_text: extractedText })
      .eq("id", playbook_id);

    if (updateError) throw new Error("Failed to save extracted text");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-playbook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  // Basic PDF text extraction - finds text between BT/ET markers and parentheses
  const text = new TextDecoder("latin1").decode(bytes);
  const textParts: string[] = [];

  // Extract text from stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const stream = match[1];
    // Find text showing operators: Tj, TJ, ', "
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(stream)) !== null) {
      textParts.push(tjMatch[1]);
    }
    // TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(stream)) !== null) {
      const innerRegex = /\(([^)]*)\)/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(arrMatch[1])) !== null) {
        textParts.push(innerMatch[1]);
      }
    }
  }

  if (textParts.length === 0) {
    // Fallback: grab anything in parentheses between BT/ET
    const btRegex = /BT\s([\s\S]*?)ET/g;
    while ((match = btRegex.exec(text)) !== null) {
      const block = match[1];
      const parenRegex = /\(([^)]*)\)/g;
      let pm;
      while ((pm = parenRegex.exec(block)) !== null) {
        textParts.push(pm[1]);
      }
    }
  }

  return textParts.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim() || 
    "[Não foi possível extrair texto do PDF. Tente enviar em formato TXT.]";
}

async function extractTextFromDocx(blob: Blob): Promise<string> {
  try {
    // DOCX is a ZIP with XML. We'll try to find document.xml
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    
    // Find word/document.xml content and extract text between <w:t> tags
    const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const parts: string[] = [];
    let match;
    while ((match = wtRegex.exec(text)) !== null) {
      parts.push(match[1]);
    }
    
    return parts.join(" ").trim() || 
      "[Não foi possível extrair texto do DOCX. Tente enviar em formato TXT.]";
  } catch {
    return "[Não foi possível extrair texto do DOCX. Tente enviar em formato TXT.]";
  }
}
