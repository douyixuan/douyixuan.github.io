" Access special Vim memory like variables
let @a = 'Hello'        | " Register
echo $PATH
let $PATH=''            | " Environment variable
let &textwidth = 79     | " Option
let &l:textwidth = 79   | " Local option
let &g:textwidth = 79   | " Global option
echo $PATH
echo "done"

" Access scopes as dictionaries (can be modified like all dictionaries)
" See the |dict-functions|, especially |get()|, for access and manipulation
echo  b:                | " All buffer variables
echo  w:                | " All window variables
echo  t:                | " All tab page variables
echo  g:                | " All global variables
echo  s:                | " All script variables
echo  v:                | " All Vim variables
function Foo(a, b)
    echo  l:                | " All local variables
    echo  a:                | " All function arguments
endfunction
call Foo('A', 'B')