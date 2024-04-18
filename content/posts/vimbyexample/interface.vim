" Re-compiler with these options
" CONF_OPT_LUA = --enable-luainterp
" CONF_OPT_PERL = --enable-perlinterp
" CONF_OPT_PYTHON = --enable-pythoninterp
" CONF_OPT_PYTHON = --enable-pythoni3nterp

echo has('lua')
echo has('perl')
echo has('python')
echo has('python3')

perl print $^V
perl print 'Hello world!'
lua print('Hello world!')
python print 'Hello world!'
python3 print 'Hello world!'