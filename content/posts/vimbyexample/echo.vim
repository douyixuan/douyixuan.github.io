" The vertical line '|' (pipe) separates commands
echo 'Hello' | echo 'world!'

pwd

echo {
\  'a': 1,
    \  'b' :     2
\   }

echo {
    \  'a': 1,
    \  'b': 2
\}

echo " Hello
    \ world "

echo [1, 
    \ 2]

" Except for some commands it does not; use the command delimiter before the
" comment (echo assumes that the quotation mark begins a string)
echo 'Hello world!'  | " Displays a message

echo - 1

echo  v:true      | " Evaluates to 1 or the string 'v:true'
echo  v:false     | " Evaluates to 0 or the string 'v:false'
echo  v:true && v:false       | " Logical AND
echo  v:true || v:false       | " Logical OR
echo  ! v:true                | " Logical NOT
echo  v:true ? 'yes' : 'no'   | " Ternary operator

" '#' (match case)
" '?' (ignore case)
echo  'a' <  'B'         | " False, True or false depending on 'ignorecase'
echo  'a' <? 'B'         | " True
echo  'a' <# 'B'         | " False

" Regular expression matching
echo  "hi" =~  "hello"    | " Regular expression match, uses 'ignorecase'
echo  "hi" =~# "hello"    | " Regular expression match, case sensitive
echo  "hi" =~? "hello"    | " Regular expression match, case insensitive
echo  "hi" !~  "hello"    | " Regular expression unmatch, use 'ignorecase'
echo  "hi" !~# "hello"    | " Regular expression unmatch, case sensitive
echo  "hi" !~? "hello"    | " Regular expression unmatch, case insensitive

" String concatenation
" The .. operator is preferred, but only supported in since Vim 8.1.1114
echo  'Hello ' .  'world'  | " String concatenation
echo  'Hello ' .. 'world'  | " String concatenation (new variant)

" List concatenation
echo  [1, 2] + [3, 4]      | " Creates a new list

echo  [[1, 2], 'Hello']    | " Lists can be nested arbitrarily

echo  [1, 2, 3, 4][:-4]    | " Sublist until second-to-last item (inclusive)
echo  [1, 2, 3, 4][:-5]    | " Sublist until second-to-last item (inclusive)

echo  {'x': {'a': 1, 'b': 2}}  | " Nested dictionary

" Indexing a dictionary
echo  {'a': 1, 'b': 2}['a']    | " Literal index
echo  {'a': 1, 'b': 2}.a       | " Syntactic sugar for simple keys

    " Funcref (|Funcref|)
" #######
"
" Reference to a function, uses the function name as a string for construction.
" When stored in a variable the name of the variable has the same restrictions
" as a function name (see below).

echo  function('type')                   | " Reference to function type()
" Note that `funcref('type')` will throw an error because the argument must be
" a user-defined function; see further below for defining your own functions.
" TODO:
" function! s:type()
"     echo "type"
" endfunction
" echo  funcref('type')                    | " Reference by identity, not name
" A lambda (|lambda|) is an anonymous function; it can only contain one
" expression in its body, which is also its implicit return value.
echo  {x -> x * x}                       | " Anonymous function
echo  function('substitute', ['hello'])  | " Partial function


echo  "1" + 1         | " Number
echo  "1" .. 1        | " String
echo  "0xA" + 1       | " Number

" number can be compared with string
echo 1 == "1"

