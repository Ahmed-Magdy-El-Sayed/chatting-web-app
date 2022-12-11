let submitBtn= document.querySelector('.login .btn');
let inputs = document.querySelectorAll('.login input');

submitBtn.onclick= e=>{
    e.target.innerHTML += `<span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>`
    document.querySelector('.login').classList.add('was-validated');
}
inputs.forEach(input=>{
    input.onkeyup=()=>{
        submitBtn.removeAttribute('disabled')
        submitBtn.innerHTML = `Submit`
    }
})