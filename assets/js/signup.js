let submitBtn= document.querySelector('.signup .btn');
let inputs = document.querySelectorAll('.signup input');

submitBtn.onclick= e=>{
    e.target.innerHTML += `<span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>`
    document.querySelector('.signup').classList.add('was-validated');
}
inputs.forEach(input=>{
    input.onkeyup=()=>{
        submitBtn.removeAttribute('disabled')
        submitBtn.innerHTML = `Submit`
    }
    input.onchange=()=>{
        submitBtn.removeAttribute('disabled')
        submitBtn.innerHTML = `Submit`
    }
})