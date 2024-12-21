set -x
# update hugo themes
go get github.com/adityatelange/hugo-PaperMod
hugo mod get -u
hugo mod tidy
