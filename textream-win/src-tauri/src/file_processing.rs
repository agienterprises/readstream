use regex::Regex;
use std::fs::File;
use std::io::Read;
use zip::ZipArchive;
use quick_xml::events::Event;
use quick_xml::reader::Reader;

#[tauri::command]
pub fn extract_pptx_notes(path: String) -> Result<String, String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut note_files = Vec::new();
    for i in 0..archive.len() {
        if let Ok(file) = archive.by_index(i) {
             let name = file.name().to_string();
            if name.starts_with("ppt/notesSlides/notesSlide") && name.ends_with(".xml") {
                note_files.push(name);
            }
        }
    }

    // Sort by slide number
    note_files.sort_by(|a, b| {
        let num_a = extract_number(a);
        let num_b = extract_number(b);
        num_a.cmp(&num_b)
    });

    let mut notes = Vec::new();
    for file_name in note_files {
        let mut file = archive.by_name(&file_name).map_err(|e| e.to_string())?;
        let mut content = String::new();
        file.read_to_string(&mut content).map_err(|e| e.to_string())?;

        let slide_notes = parse_pptx_xml(&content);
        if !slide_notes.trim().is_empty() {
            notes.push(slide_notes);
        }
    }

    Ok(notes.join("\n\n"))
}

fn extract_number(filename: &str) -> u32 {
    let re = Regex::new(r"notesSlide(\d+)\.xml").unwrap();
    if let Some(caps) = re.captures(filename) {
        if let Some(m) = caps.get(1) {
            return m.as_str().parse().unwrap_or(0);
        }
    }
    0
}

fn parse_pptx_xml(content: &str) -> String {
    let mut reader = Reader::from_str(content);
    reader.config_mut().trim_text(true);

    let mut buf = Vec::new();
    let mut text = String::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                if e.name().as_ref() == b"a:t" {
                    // Use read_text to get content of <a:t>...</a:t>
                    if let Ok(txt) = reader.read_text(e.name()) {
                         text.push_str(&txt);
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                // End of paragraph <a:p>
                if e.name().as_ref() == b"a:p" {
                     if !text.is_empty() && !text.ends_with('\n') {
                        text.push('\n');
                    }
                }
            }
            Ok(Event::Eof) => break,
            Err(_) => break,
            _ => (),
        }
        buf.clear();
    }

    text
}

#[tauri::command]
pub fn parse_markdown(content: String) -> String {
    let mut text = content;

    // Remove headers (#, ##, etc.)
    let re_headers = Regex::new(r"(?m)^#{1,6}\s+").unwrap();
    text = re_headers.replace_all(&text, "").to_string();

    // Remove bold/italic (*, **, _, __)
    let re_bold_italic = Regex::new(r"(\*\*|__|\*|_)").unwrap();
    text = re_bold_italic.replace_all(&text, "").to_string();

    // Remove links [text](url) -> text
    let re_links = Regex::new(r"\[([^\]]+)\]\([^)]+\)").unwrap();
    text = re_links.replace_all(&text, "$1").to_string();

    // Remove images ![alt](url) -> alt
    let re_images = Regex::new(r"!\[([^\]]*)\]\([^)]+\)").unwrap();
    text = re_images.replace_all(&text, "$1").to_string();

    // Remove code blocks
    let re_code = Regex::new(r"(`{3,})[\s\S]*?\1").unwrap();
    text = re_code.replace_all(&text, "").to_string();

    // Remove inline code
    let re_inline_code = Regex::new(r"`([^`]*)`").unwrap();
    text = re_inline_code.replace_all(&text, "$1").to_string();

    // Remove blockquotes
    let re_quote = Regex::new(r"(?m)^>\s+").unwrap();
    text = re_quote.replace_all(&text, "").to_string();

    text
}
