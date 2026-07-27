import AppKit
import Foundation

enum CopyError: Error, CustomStringConvertible {
  case conversionFailed(format: String, message: String)
  case invalidArguments
  case invalidText
  case missingPasteboardTypes(types: [String])
  case pasteboardWriteFailed

  var description: String {
    switch self {
    case let .conversionFailed(format, message):
      return "Could not convert HTML to \(format): \(message)"
    case .invalidArguments:
      return "Usage: swift copy-rich-email.swift /absolute/path/to/email.html | --verify"
    case .invalidText:
      return "textutil produced text with an unknown encoding"
    case let .missingPasteboardTypes(types):
      return "Clipboard is missing: \(types.joined(separator: ", "))"
    case .pasteboardWriteFailed:
      return "Could not publish all clipboard formats"
    }
  }
}

func convert(_ html: Data, to format: String) throws -> Data {
  let process = Process()
  let input = Pipe()
  let output = Pipe()
  let errors = Pipe()

  process.executableURL = URL(fileURLWithPath: "/usr/bin/textutil")
  process.arguments = ["-stdin", "-format", "html", "-convert", format, "-stdout"]
  process.standardInput = input
  process.standardOutput = output
  process.standardError = errors

  try process.run()
  input.fileHandleForWriting.write(html)
  try input.fileHandleForWriting.close()

  let converted = output.fileHandleForReading.readDataToEndOfFile()
  let errorData = errors.fileHandleForReading.readDataToEndOfFile()
  process.waitUntilExit()

  guard process.terminationStatus == 0 else {
    let message = String(decoding: errorData, as: UTF8.self)
      .trimmingCharacters(in: .whitespacesAndNewlines)
    throw CopyError.conversionFailed(format: format, message: message)
  }

  return converted
}

func verify(_ pasteboard: NSPasteboard) throws {
  let required: [(type: NSPasteboard.PasteboardType, name: String)] = [
    (.html, "HTML"),
    (.rtf, "RTF"),
    (.string, "plain text"),
  ]
  let missing = required.compactMap { item in
    guard let data = pasteboard.data(forType: item.type), !data.isEmpty else {
      return item.name
    }
    return nil
  }

  guard missing.isEmpty else {
    throw CopyError.missingPasteboardTypes(types: missing)
  }
}

do {
  guard CommandLine.arguments.count == 2 else {
    throw CopyError.invalidArguments
  }

  if CommandLine.arguments[1] == "--verify" {
    try verify(NSPasteboard.general)
    print("Clipboard contains HTML, RTF, and plain text.")
    exit(0)
  }

  let htmlURL = URL(fileURLWithPath: CommandLine.arguments[1])
  let html = try Data(contentsOf: htmlURL)
  let rtf = try convert(html, to: "rtf")
  let textData = try convert(html, to: "txt")

  guard let text = String(data: textData, encoding: .utf8) else {
    throw CopyError.invalidText
  }

  let pasteboard = NSPasteboard.general
  pasteboard.clearContents()

  let wroteHTML = pasteboard.setData(html, forType: .html)
  let wroteRTF = pasteboard.setData(rtf, forType: .rtf)
  let wroteText = pasteboard.setString(text, forType: .string)

  guard wroteHTML, wroteRTF, wroteText else {
    throw CopyError.pasteboardWriteFailed
  }

  try verify(pasteboard)
  print("Copied HTML, RTF, and plain text to clipboard.")
} catch {
  FileHandle.standardError.write(Data("\(error)\n".utf8))
  exit(1)
}
