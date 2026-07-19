import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { UpdateForm } from './UpdateForm.jsx';
import { UpdateBoard } from './UpdateBoard.jsx';

export function UpdatesPage() {
  const [items, setItems] = useState([]);

  const reload = useCallback(async () => {
    const data = await api.getUpdateRequests();
    setItems(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <section className="view">
      <h2>Pedidos de atualização</h2>
      <p>Peça melhorias ou avise sobre bugs — acompanhe o status até ficar pronto.</p>

      <UpdateForm onCreated={reload} />
      <UpdateBoard items={items} onChanged={reload} />
    </section>
  );
}
