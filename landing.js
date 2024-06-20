var a = document.querySelector(".outline")
var b = document.querySelector(".popup")
var c = document.querySelector("#rule")
var d = document.querySelector("#back")
function appear(){
    a.style.display = "block"
    b.style.display = "block"
}
function remove(){
    a.style.display = "none"
    b.style.display = "none"

}
c.addEventListener("click",appear)
d.addEventListener("click",remove)
