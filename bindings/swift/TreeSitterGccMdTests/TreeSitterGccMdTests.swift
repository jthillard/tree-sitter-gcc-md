import XCTest
import SwiftTreeSitter
import TreeSitterGccMd

final class TreeSitterGccMdTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_gcc_md())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading GccMd grammar")
    }
}
