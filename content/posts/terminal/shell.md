---
title:     'Shell'
date:      2025-03-23T23:09:47+08:00
author:    Cedric
draft:     true
summary:   read more
categories:
tags:
---

# Comparing Bash, Zsh, and Fish Shell

Shell environments play a crucial role in a developer's workflow. Here's a comparison of three popular shells: Bash, Zsh, and Fish.

## Bash (Bourne Again SHell)

The default shell on most Linux distributions and macOS (until Catalina).

### Key Features
- POSIX-compliant
- Command history
- Tab completion
- Scripting capabilities
- Configurable via `.bashrc` and `.bash_profile`

### Example Commands
```bash
# Variable assignment
name="John"
echo $name

# Conditional
if [ -f file.txt ]; then
    echo "File exists"
fi
```

## Zsh (Z Shell)

A powerful shell that extends Bash functionality.

### Key Features
- Improved tab completion
- Spelling correction
- Path expansion
- Shared command history across sessions
- Theme support via Oh-My-Zsh
- Configurable via `.zshrc`

### Example Commands
```zsh
# Array operations
array=(one two three)
echo ${array[2]}  # Outputs "two" (zero-indexed)

# Extended globbing
ls -la **/*.txt  # Recursive search
```

## Fish (Friendly Interactive SHell)

A user-friendly shell focused on interactivity and usability.

### Key Features
- Syntax highlighting
- Autosuggestions based on history
- Web-based configuration
- Out-of-the-box experience with minimal setup
- Configurable via `config.fish`

### Example Commands
```fish
# Variable assignment (note the different syntax)
set name "John"
echo $name

# Conditionals use different syntax
if test -f file.txt
    echo "File exists"
end
```

## Major Differences

| Feature | Bash | Zsh | Fish |
|---------|------|-----|------|
| Syntax | POSIX-compatible | POSIX-compatible | Not POSIX-compatible |
| Configuration | `.bashrc` | `.zshrc` | `config.fish` |
| Tab completion | Basic | Advanced | Advanced with preview |
| Scripting | Widely used | Similar to Bash | Different syntax |
| Default prompt | Basic | Customizable | Feature-rich by default |
| Plugin ecosystem | Limited | Oh-My-Zsh | Fisher/Oh-My-Fish |

## When to Choose Each

- **Bash**: When portability and wide compatibility are priorities
- **Zsh**: When you want a balance of features and compatibility
- **Fish**: When you prioritize user-friendliness and modern features over compatibility

Fish is great for interactive use, but scripts written for it won't work in Bash or Zsh environments. Zsh offers a good balance, while Bash remains the standard for script compatibility.

## Command Compare

## Command Comparison

Here's a comparison of common commands across the three shells:

| Operation | Bash | Zsh | Fish |
|-----------|------|-----|------|
| Define variable | `var="value"` | `var="value"` | `set var "value"` |
| Reference variable | `$var` or `${var}` | `$var` or `${var}` | `$var` |
| Conditional | `if [ $var -eq 0 ]; then` | `if [ $var -eq 0 ]; then` | `if test $var -eq 0` |
| End block | `fi` | `fi` | `end` |
| For loop | `for i in {1..5}; do` | `for i in {1..5}; do` | `for i in (seq 1 5)` |
| Function | `function name() {` | `function name() {` | `function name` |
| Command substitution | `$(command)` | `$(command)` | `(command)` |
| Pipe and grep | `ls -la \| grep "file"` | `ls -la \| grep "file"` | `ls -la \| grep "file"` |
| Environment vars | `export VAR=value` | `export VAR=value` | `set -x VAR value` |
| Source file | `source file.sh` | `source file.zsh` | `source file.fish` |
| Comment | `# Comment` | `# Comment` | `# Comment` |

## Key Command Differences Between Bash and Zsh

While Bash and Zsh share many commands, Zsh offers several enhancements:

### Globbing (Pattern Matching)
- **Bash**: `ls *.txt`
- **Zsh**: Supports recursive globbing with `**` - `ls **/*.txt`

### Array Indexing
- **Bash**: Zero-based indexing `${array[0]}`
- **Zsh**: Both zero-based and one-based indexing supported

### Wildcard Matching
- **Bash**: Basic wildcards
- **Zsh**: Extended options like `ls -d ^*.txt` (negation)

### Directory Stack
- **Both**: Support `pushd`/`popd`
- **Zsh**: Additional `dirs -v` with enhanced output

### Spelling Correction
- **Bash**: None built-in
- **Zsh**: `setopt CORRECT` or `CORRECT_ALL`

### History Expansion
- **Bash**: Basic history with `!`
- **Zsh**: Enhanced with options like `!:0` (command name only)

### Path Replacement
- **Bash**: Limited
- **Zsh**: `cd old new` replaces "old" with "new" in current path

