function! s:GetComments()
    return 
endfunction

function! s:Main()
    let path = "hi.vim"
    let code = readfile(path)
    echo code
    call s:GetComments()
endfunction

call s:Main()
