echo "iterate a list "
let list = [0, 1, 2, 3, 4,]
echon list
for item in list
    echo item
endfor

echo "iterate a dict "
let dict = {'x':1, 'y':2, 'z':3, 'u':4, 'v':5, 'w':6,}
echon dict
for [key, val] in items(dict)
    echo key . ' = ' . val
endfor
echo "sort keys and get value by keys"
for key in sort(keys(dict))
    echo key . ' = ' . dict[key]
endfor
echo "get only values"
for val in values(dict)
    echo val
endfor
