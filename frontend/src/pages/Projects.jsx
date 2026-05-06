import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API } from '../context/AuthContext';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetch = () => {
    axios.get(`${API}/api/projects`).then(r => {
      setProjects(r.data); setLoading(false);
    });
  };
  useEffect(fetch, []);

  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      await axios.post(`${API}/api/projects`, form);
      setShowModal(false); setForm({ name: '', description: '' }); fetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <p>📁</p>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      )}

      <div className="projects-grid">
        {projects.map(p => (
          <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
            <div className="project-color" style={{ background: stringToColor(p.name) }} />
            <div className="project-body">
              <h3>{p.name}</h3>
              <p className="project-desc">{p.description || 'No description'}</p>
              <div className="project-footer">
                <span className="members-count">👥 {p.members?.length ?? 0} members</span>
                <span className="tasks-count">📋 {p.tasks?.length ?? 0} tasks</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Project</h2>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Project Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" style={{ resize: 'vertical' }} />
              </div>
              {error && <p className="error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#6c63ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  return colors[Math.abs(hash) % colors.length];
}
