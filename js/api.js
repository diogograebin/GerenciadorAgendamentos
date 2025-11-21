const API_AGENDAMENTOS = 'https://691d045dd58e64bf0d34bad0.mockapi.io/agendamentos';
const API_USUARIOS = 'https://691d045dd58e64bf0d34bad0.mockapi.io/users';

export async function getAgendamentos() {
  const res = await fetch(API_AGENDAMENTOS);
  if (!res.ok) throw new Error('Falha ao buscar agendamentos');
  return res.json();
}

export async function getAgendamento(id) {
  const res = await fetch(`${API_AGENDAMENTOS}/${id}`);
  if (!res.ok) throw new Error('Falha ao buscar agendamento');
  return res.json();
}

export async function criarAgendamento(dados) {
  const res = await fetch(API_AGENDAMENTOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!res.ok) throw new Error('Falha ao criar agendamento');
  return res.json();
}

export async function atualizarAgendamento(id, dados) {
  const res = await fetch(`${API_AGENDAMENTOS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!res.ok) throw new Error('Falha ao atualizar agendamento');
  return res.json();
}

export async function excluirAgendamento(id, userId) {
  if (!id) {
    console.error('excluirAgendamento chamado sem id válido', id);
    throw new Error('ID inválido para exclusão');
  }

  // Tenta rota simples primeiro
  const simpleUrl = `${API_AGENDAMENTOS}/${id}`;
  let res;
  try {
    res = await fetch(simpleUrl, { method: 'DELETE' });
  } catch (networkErr) {
    console.error('Erro de rede ao tentar DELETE simples', simpleUrl, networkErr);
    throw new Error('Falha de rede ao excluir agendamento');
  }
  let raw = await res.text();
  if (res.ok) {
    try { console.debug('DELETE simples ok', raw ? JSON.parse(raw) : raw); } catch (_) { }
    return { success: true, notFound: false };
  }

  // Se 404 e houver userId, tenta rota aninhada
  if (res.status === 404 && userId) {
    const nestedUrl = `${API_USUARIOS}/${userId}/agendamentos/${id}`;
    try {
      const nestedRes = await fetch(nestedUrl, { method: 'DELETE' });
      if (nestedRes.ok) {
        return { success: true, notFound: false };
      }
    } catch (nestedErr) {
      console.error('Erro de rede ao tentar DELETE nested', nestedErr);
      throw new Error('Falha ao excluir agendamento');
    }
  }

  console.error('Falha ao excluir agendamento', { status: res.status, statusText: res.statusText, corpo: raw, url: simpleUrl });
  if (res.status === 404) {
    // Trata como já removido
    return { success: true, notFound: true };
  }
  throw new Error('Falha ao excluir agendamento');
}

// Usuários
export async function getUsuarios() {
  const res = await fetch(API_USUARIOS);
  if (!res.ok) throw new Error('Falha ao buscar usuários');
  return res.json();
}

export async function criarUsuario(dados) {
  const res = await fetch(API_USUARIOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!res.ok) throw new Error('Falha ao criar usuário');
  return res.json();
}

export async function getUsuario(id) {
  const res = await fetch(`${API_USUARIOS}/${id}`);
  if (!res.ok) throw new Error('Falha ao buscar usuário');
  return res.json();
}
