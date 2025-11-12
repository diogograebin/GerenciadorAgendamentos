const formNovo = document.getElementById('formNovo');
const lista = document.getElementById('listaAgendamentos');

formNovo.addEventListener('submit', function (e) {
    e.preventDefault();

    const nome = formNovo.querySelector('input[type="text"]').value;
    const data = formNovo.querySelector('input[type="date"]').value;
    const hora = formNovo.querySelector('input[type="time"]').value;
    const sala = formNovo.querySelector('select').value;

    adicionarCard(nome, data, hora, sala);

    formNovo.reset(); // limpa o form
});

function adicionarCard(nome, data, hora, sala) {
    const col = document.createElement('div');
    col.classList.add('col-md-4');

    col.innerHTML = `
        <div class="card shadow-sm p-3">
            <div>
                <h5 class="mb-1">${nome}</h5>
                <p class="text-muted mb-1">${sala} — ${hora} • ${data}</p>
                <span class="badge bg-success mb-2">Agendado</span>

                <p class="text-muted small">Nenhuma observação.</p>

                <div class="d-flex justify-content-between mt-3">
                    <button class="btn btn-primary btn-sm">Detalhes</button>
                    <button class="btn btn-warning btn-sm">Editar</button>
                    <button class="btn btn-danger btn-sm">Excluir</button>
                </div>
            </div>
        </div>
    `;

    lista.appendChild(col);
}

const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovo'));
modal.hide();