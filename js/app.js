import { getAgendamentos, criarAgendamento, atualizarAgendamento, excluirAgendamento, getAgendamento } from './api.js';

const $ = id => document.getElementById(id);
const formNovo = $('formNovo');
const lista = $('listaAgendamentos');
const filtroCliente = $('filtroCliente');
const filtroClienteWrap = filtroCliente.parentElement;
const btnNovoUsuario = $('btnNovoUsuario');
const modalNovoUsuario = $('modalNovoUsuario') ? new bootstrap.Modal($('modalNovoUsuario')) : null;
const filtroData = $('filtroData');
const filtroHora = $('filtroHora');
const chkSomenteMeus = $('chkSomenteMeus');
const btnBuscarFiltros = $('btnBuscarFiltros');
const btnLimparFiltros = $('btnLimparFiltros');
const modalNovo = new bootstrap.Modal($('modalNovo'));
const modalDet = new bootstrap.Modal($('modalDetalhes'));
const modalEdit = new bootstrap.Modal($('modalEditar'));
const btnLogout = $('btnLogout');
const userInfo = $('userInfo');
let agendamentos = [], agendamentosFiltrados = [], usuarioLogado = null, isAdmin = false;

// Carrega lista inicial
document.addEventListener('DOMContentLoaded', async () => {
    const u = localStorage.getItem('usuarioLogado');
    if (!u) return window.location.href = 'login.html';
    usuarioLogado = JSON.parse(u);
    isAdmin = !!usuarioLogado.admin;
    filtroClienteWrap.style.display = isAdmin ? '' : 'none';
    btnNovoUsuario.classList.toggle('d-none', !isAdmin);
    if (userInfo) {
        userInfo.innerHTML = `
        <span class="fw-semibold" style="padding-right:30px;">
            ${usuarioLogado.nome || ''}
            ${isAdmin ? '<i class="bi bi-shield-lock-fill text-danger" title="Administrador"></i>' : ''}
        </span>
    `;
    }

    // Atualização automática dos agendamentos a cada 2 segundos, respeitando filtros
    await carregarAgendamentos();
    setInterval(async () => {
        agendamentos = await getAgendamentos();
        aplicarFiltros();
    }, 2000);
});

async function carregarAgendamentos() {
    try {
        agendamentos = await getAgendamentos();
        agendamentosFiltrados = [...agendamentos];
        renderLista(agendamentosFiltrados);
    } catch (e) {
        console.error(e);
        lista.innerHTML = `<div class="col-12"><div class="alert alert-danger">Não foi possível carregar os agendamentos.</div></div>`;
    }
}

// Renderização
function renderLista(items) {
    lista.innerHTML = '';
    if (!items || items.length === 0) {
        lista.innerHTML = `<div class="col-12 text-center text-muted">Nenhum agendamento encontrado.</div>`;
        return;
    }
    items.forEach(addCard);
}

function formatDateISOToBR(iso) {
    if (!iso) return '';
    // Aceita tanto yyyy-mm-dd quanto dd/mm/aaaa
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
        const [ano, mes, dia] = iso.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}/.test(iso)) {
        return iso; // já está no formato
    }
    return iso;
}

function addCard(item) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    const badge = item.status === false ? '<span class="badge bg-secondary mb-2">Cancelado</span>' : '<span class="badge bg-success mb-2">Agendado</span>';
    const obs = item.observacoes && item.observacoes.trim() ? item.observacoes : 'Sem observações.';
    const nome = item.nome || 'Cliente';
    const horaIntervalo = item.horaInicial && item.horaFinal ? `${item.horaInicial} - ${item.horaFinal}` : '';
    const dataBr = formatDateISOToBR(item.data);
    const podeGerenciar = isAdmin || (usuarioLogado && item.userId === usuarioLogado.id);
    col.innerHTML = `
        <div class="card shadow-sm p-3 h-100">
            <div>
                <h5 class="mb-1">${nome}</h5>
                <p class="text-muted mb-1">${item.sala || 'Sala'} — ${horaIntervalo} • ${dataBr}</p>
                ${badge}
                <p class="text-muted small">${obs}</p>
                <div class="d-flex justify-content-between mt-3 flex-wrap gap-2">
                    <button class="btn btn-primary btn-sm" data-action="detalhes" data-id="${item.id}">Detalhes</button>
                    ${podeGerenciar ? `<button class="btn btn-warning btn-sm" data-action="editar" data-id="${item.id}">Editar</button>` : ''}
                    ${podeGerenciar ? `<button class="btn btn-danger btn-sm" data-action="excluir" data-id="${item.id}">Excluir</button>` : ''}
                </div>
            </div>
        </div>
    `;
    lista.appendChild(col);
}

// Create
formNovo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = usuarioLogado ? usuarioLogado.nome : 'Cliente';
    const data = formNovo.querySelector('input[type="date"]').value;
    const horaInicial = document.getElementById('horaInicialNovo').value;
    const horaFinal = document.getElementById('horaFinalNovo').value;
    const sala = formNovo.querySelector('select').value;
    const observacoes = document.getElementById('obsNovo').value || '';

    if (!data || !horaInicial || !horaFinal) {
        alert('Preencha data e intervalo de horas.');
        return;
    }

    if (horaFinal <= horaInicial) {
        alert('Hora final deve ser maior que hora inicial.');
        return;
    }

    // Validação de conflito
    const conflito = agendamentos.some(a => {
        if (a.sala !== sala || a.data !== data || a.status === false) return false;
        const iniExist = a.horaInicial;
        const fimExist = a.horaFinal;
        return (horaInicial < fimExist && horaFinal > iniExist);
    });
    if (conflito) {
        alert('Conflito: sala já reservada nesse intervalo.');
        return;
    }

    if (!usuarioLogado) {
        alert('Faça login.');
        window.location.href = 'login.html';
        return;
    }

    const novo = { nome, data, horaInicial, horaFinal, sala, status: true, observacoes, userId: usuarioLogado.id };
    try {
        await criarAgendamento(novo);
        formNovo.reset();
        modalNovo.hide();
        await carregarAgendamentos();
    } catch (e) {
        alert('Erro ao criar agendamento.');
    }
});

// Delegação para detalhes, editar, excluir
lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    try {
        if (action === 'detalhes') {
            const item = await getAgendamento(id);
            preencherDetalhes(item);
            modalDet.show();
        }
        if (action === 'editar') {
            const item = await getAgendamento(id);
            preencherEditar(item);
            modalEdit.show();
        }
        if (action === 'excluir') {
            const item = agendamentos.find(a => a.id === id);
            if (!item) return;
            if (!isAdmin && (!usuarioLogado || item.userId !== usuarioLogado.id)) return alert('Você não pode excluir este agendamento.');
            if (confirm('Tem certeza que deseja excluir?')) {
                const result = await excluirAgendamento(id, item.userId);
                if (!result.success) throw new Error('Falha ao excluir');
                if (result.notFound) {
                    agendamentos = agendamentos.filter(a => a.id !== id);
                    agendamentosFiltrados = agendamentosFiltrados.filter(a => a.id !== id);
                    renderLista(agendamentosFiltrados);
                } else {
                    await carregarAgendamentos();
                }
            }
        }
    } catch (err) {
        alert('Falha ao processar ação.');
    }
});

// Detalhes helpers
function preencherDetalhes(item) {
    document.getElementById('detNome').textContent = item.nome || '';
    document.getElementById('detData').textContent = item.data || '';
    document.getElementById('detHora').textContent = (item.horaInicial && item.horaFinal) ? `${item.horaInicial} - ${item.horaFinal}` : '';
    document.getElementById('detSala').textContent = item.sala || '';
    document.getElementById('detStatus').textContent = item.status === false ? 'Cancelado' : 'Agendado';
    document.getElementById('detObs').textContent = item.observacoes || 'Sem observações.';
}

// Edit helpers
const formEditar = document.getElementById('formEditar');
function preencherEditar(item) {
    document.getElementById('editId').value = item.id;
    document.getElementById('editNome').value = item.nome || '';
    document.getElementById('editData').value = item.data || '';
    document.getElementById('editHoraInicial').value = item.horaInicial || '';
    document.getElementById('editHoraFinal').value = item.horaFinal || '';
    document.getElementById('editSala').value = item.sala || 'Sala 1';
    document.getElementById('editStatus').value = String(item.status !== false);
    document.getElementById('editObs').value = item.observacoes || '';
}

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('editNome').value.trim();
    const data = document.getElementById('editData').value;
    const horaInicial = document.getElementById('editHoraInicial').value;
    const horaFinal = document.getElementById('editHoraFinal').value;
    const sala = document.getElementById('editSala').value;
    const status = document.getElementById('editStatus').value === 'true';
    const observacoes = document.getElementById('editObs').value;

    if (!data || !horaInicial || !horaFinal) {
        alert('Preencha data e intervalo de horas.');
        return;
    }
    if (horaFinal <= horaInicial) {
        alert('Hora final deve ser maior que hora inicial.');
        return;
    }

    // Conflito (excluindo o próprio id)
    const conflito = agendamentos.some(a => {
        if (a.id === id) return false;
        if (a.sala !== sala || a.data !== data || a.status === false) return false;
        return (horaInicial < a.horaFinal && horaFinal > a.horaInicial);
    });
    if (conflito) {
        alert('Conflito: sala já reservada nesse intervalo.');
        return;
    }

    const item = agendamentos.find(a => a.id === id);
    if (!item || (!isAdmin && (!usuarioLogado || item.userId !== usuarioLogado.id))) {
        alert('Você não pode editar este agendamento.');
        return;
    }

    try {
        await atualizarAgendamento(id, { nome, data, horaInicial, horaFinal, sala, status, observacoes, userId: usuarioLogado.id });
        modalEdit.hide();
        await carregarAgendamentos();
    } catch (_) {
        alert('Falha ao salvar alterações.');
    }
});

// Filtros
function aplicarFiltros() {
    const cliente = (filtroCliente.value || '').toLowerCase();
    const data = filtroData.value || '';
    const hora = filtroHora.value || '';
    const somenteMeus = chkSomenteMeus.checked;

    agendamentosFiltrados = agendamentos.filter(a => {
        const okNome = isAdmin ? (cliente ? (a.nome || '').toLowerCase().includes(cliente) : true) : true;
        const okData = data ? (a.data || '') === data : true;
        const okHora = hora ? ((a.horaInicial && a.horaFinal) ? (a.horaInicial === hora || a.horaFinal === hora) : false) : true;
        const okOwner = somenteMeus ? (usuarioLogado && a.userId === usuarioLogado.id) : true;
        return okNome && okData && okHora && okOwner;
    });
    renderLista(agendamentosFiltrados);
}
// Novo usuário (admin)
if (btnNovoUsuario && modalNovoUsuario) {
    btnNovoUsuario.onclick = () => modalNovoUsuario.show();
    $('formNovoUsuario').onsubmit = async e => {
        e.preventDefault();
        const nome = $('novoUserNome').value.trim();
        const email = $('novoUserEmail').value.trim();
        const telefone = $('novoUserTelefone').value.trim();
        const senha = $('novoUserSenha').value.trim();
        if (!nome || !email || !senha) return alert('Preencha nome, email e senha.');
        try {
            await import('./api.js').then(api => api.criarUsuario({ nome, email, telefone, senha, admin: false }));
            $('formNovoUsuario').reset();
            modalNovoUsuario.hide();
            alert('Usuário criado com sucesso!');
        } catch {
            alert('Erro ao criar usuário.');
        }
    };
}

btnBuscarFiltros.onclick = aplicarFiltros;
chkSomenteMeus.onchange = aplicarFiltros;
btnLimparFiltros.onclick = () => {
    filtroCliente.value = '';
    filtroData.value = '';
    filtroHora.value = '';
    chkSomenteMeus.checked = false;
    agendamentosFiltrados = [...agendamentos];
    renderLista(agendamentosFiltrados);
};
btnLogout.onclick = () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
};
