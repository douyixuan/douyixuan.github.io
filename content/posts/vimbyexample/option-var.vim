" use `set` to set options as variables
" care for the space
set textwidth=80
echo &textwidth
set nowrap
echo &wrap
set wrap
echo &wrap

" use let to set options as variables
let &textwidth = 10
set textwidth?

let &textwidth = &textwidth + 10
set textwidth?

" local options instead of global
" set number
let &l:number = 1
" set nonumber
let &l:number = 0
" set number locally
setlocal number
