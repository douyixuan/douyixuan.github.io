" for loop
for _ in range(5)
    echo 'Hello World!'
endfor

" range
echo range(10)       |" => [0, 10)
echo range(1, 10)    |" => [1, 10]
echo range(1, 10, 2) |" => 从 1 开始步长为 2 的序列，不能超过 10
echo range(0, 10, 2)
" for and range
for i in range(10)
    if i >= 5
        break
    elseif i % 2
        continue
    endif
    echo i
endfor

" " loop-var scope
unlet! i
for i in range(10)
    echo i
endfor
echo 'done' . i

unlet! i
for i in []
    echo i
endfor
" E121Undefined variablei
" echo 'done' . i

unlet! i
for i in range(10)
    echo i
    unlet i
endfor
echo 'done'

echo "use while"
let i = 0
while i < 5
    echo i
    let i += 1
endwhile

