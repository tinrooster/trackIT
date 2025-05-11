import React, { useEffect, useState } from 'react';

interface Entity {
  id: string;
  name: string;
  type?: string;
  description?: string;
  status?: string;
  order?: number;
}

type EntityType = 'location' | 'project';

export default function AdminEntityManager({ type }: { type: EntityType }) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [form, setForm] = useState<Partial<Entity>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/${type}`)
      .then(r => r.json())
      .then(setEntities);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/entity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data: form, id: editingId }),
    });
    if (!res.ok) return setError('Failed to save');
    const saved = await res.json();
    setEntities(prev => {
      const idx = prev.findIndex(ent => ent.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setForm({});
    setEditingId(null);
  };

  const handleEdit = (entity: Entity) => {
    setForm(entity);
    setEditingId(entity.id);
  };

  const handleReorder = async (from: number, to: number) => {
    if (to < 0 || to >= entities.length) return;
    const reordered = [...entities];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setEntities(reordered);
    await fetch('/api/admin/entity/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, orderedIds: reordered.map(e => e.id) }),
    });
  };

  return (
    <div>
      <h2>Admin {type.charAt(0).toUpperCase() + type.slice(1)} Manager</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name || ''}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        {type === 'location' && (
          <input
            placeholder="Type"
            value={form.type || ''}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            required
          />
        )}
        <input
          placeholder="Description"
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        {type === 'project' && (
          <input
            placeholder="Status"
            value={form.status || ''}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          />
        )}
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" onClick={() => { setForm({}); setEditingId(null); }}>Cancel</button>}
      </form>
      <ul>
        {entities.map((entity, idx) => (
          <li key={entity.id}>
            {entity.name} {entity.type && `(${entity.type})`} {entity.status && `[${entity.status}]`}
            <button onClick={() => handleEdit(entity)}>Edit</button>
            <button disabled={idx === 0} onClick={() => handleReorder(idx, idx - 1)}>↑</button>
            <button disabled={idx === entities.length - 1} onClick={() => handleReorder(idx, idx + 1)}>↓</button>
          </li>
        ))}
      </ul>
    </div>
  );
} 