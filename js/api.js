const API_URL = 'https://<teu-endpoint>.mockapi.io/agendamentos';

export async function getAgendamentos() {
  const res = await fetch(API_URL);
  return res.json();
}

export async function criarAgendamento(dados) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return res.json();
}

export async function atualizarAgendamento(id, dados) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return res.json();
}

export async function excluirAgendamento(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
}
