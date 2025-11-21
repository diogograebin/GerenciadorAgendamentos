import { getUsuarios, criarUsuario } from './api.js';

const form = document.getElementById('formLogin');
const btnToggle = document.getElementById('btnToggle');
const formTitle = document.getElementById('formTitle');
const btnSubmit = document.getElementById('btnSubmit');
const toggleText = document.getElementById('toggleText');
const groupNome = document.getElementById('groupNome');
const groupTelefone = document.getElementById('groupTelefone');

let modoCadastro = false;

btnToggle.addEventListener('click', () => {
    modoCadastro = !modoCadastro;
    if (modoCadastro) {
        formTitle.textContent = 'Criar Conta';
        btnSubmit.textContent = 'Cadastrar';
        toggleText.textContent = 'Já possui conta?';
        btnToggle.textContent = 'Entrar';
        groupNome.classList.remove('d-none');
        groupTelefone.classList.remove('d-none');
    } else {
        formTitle.textContent = 'Entrar';
        btnSubmit.textContent = 'Entrar';
        toggleText.textContent = 'Não tem conta?';
        btnToggle.textContent = 'Cadastre-se';
        groupNome.classList.add('d-none');
        groupTelefone.classList.add('d-none');
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const nome = document.getElementById('nome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    if (!email || !senha) {
        alert('Preencha email e senha.');
        return;
    }

    if (modoCadastro) {
        if (!nome) {
            alert('Informe o nome.');
            return;
        }
        try {
            const novo = await criarUsuario({ nome, email, telefone, senha });
            localStorage.setItem('usuarioLogado', JSON.stringify(novo));
            window.location.href = 'index.html';
        } catch (_) {
            alert('Erro ao cadastrar.');
        }
    } else {
        try {
            const usuarios = await getUsuarios();
            const encontrado = usuarios.find(u => u.email === email && u.senha === senha);
            if (!encontrado) {
                alert('Credenciais inválidas.');
                return;
            }
            localStorage.setItem('usuarioLogado', JSON.stringify(encontrado));
            window.location.href = 'index.html';
        } catch (_) {
            alert('Erro ao autenticar.');
        }
    }
});

// Se já logado redireciona
const ja = localStorage.getItem('usuarioLogado');
if (ja) {
    window.location.href = 'index.html';
}
