import AppKit

let canvasSize = NSSize(width: 1152, height: 1152)
let image = NSImage(size: canvasSize)
image.lockFocus()

NSColor.clear.setFill()
NSRect(origin: .zero, size: canvasSize).fill()

let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center

let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 188, weight: .black),
    .foregroundColor: NSColor.white,
    .kern: 14,
    .paragraphStyle: paragraph,
]

let wordmark = NSString(string: "BNC")
let wordmarkSize = wordmark.size(withAttributes: attributes)
let wordmarkRect = NSRect(
    x: 0,
    y: (canvasSize.height - wordmarkSize.height) / 2,
    width: canvasSize.width,
    height: wordmarkSize.height
)
wordmark.draw(in: wordmarkRect, withAttributes: attributes)

image.unlockFocus()

guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
else {
    fatalError("Unable to render splash wordmark")
}

let output = URL(fileURLWithPath: CommandLine.arguments[1])
try png.write(to: output)
