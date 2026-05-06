import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, API } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const StatCard = ({ label, value, color }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <p className="stat-value" style={{ color }}>{value}</p>
    <p className="stat-label">{label}</p>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/dashboard`).then(r => {
      setData(r.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const s = data?.stats || {};

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Here's what's happening across your projects</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Projects" value={s.totalProjects ?? 0} color="#6c63ff" />
        <StatCard label="My Tasks" value={s.myTasks ?? 0} color="#3b82f6" />
        <StatCard label="In Progress" value={s.inProgress ?? 0} color="#f59e0b" />
        <StatCard label="Overdue 🔥" value={s.overdue ?? 0} color="#ef4444" />
        <StatCard label="To Do" value={s.todo ?? 0} color="#8892a4" />
        <StatCard label="Completed" value={s.done ?? 0} color="#10b981" />
      </div>

      <div className="dash-grid">
        <section className="card">
          <h2>Recent Tasks</h2>
          {data?.recentTasks?.length === 0 && <p className="empty">No tasks yet</p>}
          <ul className="task-list">
            {data?.recentTasks?.map(task => (
              <li key={task.id} className="task-item">
                <div>
                  <p className="task-title">{task.title}</p>
                  <p className="task-meta">
                    {task.project?.name} · {task.dueDate ? `Due ${task.dueDate}` : 'No due date'}
                  </p>
                </div>
                <span className={`badge badge-${task.status}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>My Assigned Tasks</h2>
          {data?.myTasks?.length === 0 && <p className="empty">No tasks assigned to you</p>}
          <ul className="task-list">
            {data?.myTasks?.map(task => (
              <li key={task.id} className="task-item">
                <div>
                  <p className="task-title">{task.title}</p>
                  <p className="task-meta">
                    {task.project?.name}
                    {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                      ? ' · ⚠️ Overdue' : ''}
                  </p>
                </div>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </li>
            ))}
          </ul>
          <Link to="/projects" style={{ display: 'block', marginTop: 16, textAlign: 'center', color: 'var(--accent-light)', fontSize: 13 }}>
            View all projects →
          </Link>
        </section>
      </div>
    </div>
  );
}
