package tree_sitter_gcc_md_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_gcc_md "codeberg.org/arsen/gcc-md-mode/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_gcc_md.Language())
	if language == nil {
		t.Errorf("Error loading GccMd grammar")
	}
}
