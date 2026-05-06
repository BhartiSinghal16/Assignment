import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [taskError, setTaskError] = useState('');

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberError, setMemberError] = useState('');

  const isProjectAdmin = () => {
    if (isAdmin) return true;
    const me = project?.members?.find(m => m.id === user.id);
    return me?.ProjectMember?.role === 'admin';
  };

  const fetchProject = async () => {
    try {
      const [proj, taskRes] = await Promise.all([
        axios.get(`${API}/api/projects/${id}`),
        axios.get(`${API}/api/tasks/project/${id}`),
      ]);
      setProject(proj.data);
      setTasks(taskRes.data);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const openCreate = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', assigneeId: '', priority: 'medium', dueDate: '', status: 'todo' });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      assigneeId: task.assigneeId || '', priority: task.priority,
      dueDate: task.dueDate || '', status: task.status,
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const submitTask = async e => {
    e.preventDefault(); setTaskError('');
    try {
      if (editTask) {
        await axios.patch(`${API}/api/tasks/${editTask.id}`, taskForm);
      } else {
        await axios.post(`${API}/api/tasks`, { ...taskForm, projectId: id });
      }
      setShowTaskModal(false); fetchProject();
    } catch (err) { setTaskError(err.response?.data?.message || 'Failed'); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await axios.delete(`${API}/api/tasks/${taskId}`);
    fetchProject();
  };

  const quickStatus = async (task, status) => {
    await axios.patch(`${API}/api/tasks/${task.id}`, { status });
    fetchProject();
  };

  const addMember = async e => {
    e.preventDefault(); setMemberError('');
    try {
      await axios.post(`${API}/api/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setShowMemberModal(false); setMemberEmail(''); fetchProject();
    } catch (err) { setMemberError(err.response?.data?.message || 'Failed'); }
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await axios.delete(`${API}/api/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div className="spinner" />;
  if (!project) return null;

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const overdue = tasks.filter(t => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'done');

  return (
    <div className="project-detail">
      <div className="detail-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/projects')}>← Projects</button>
          <h1>{project.name}</h1>
          {project.description && <p className="page-sub">{project.description}</p>}
        </div>
        <div className="header-actions">
          {isProjectAdmin() && (
            <>
              <button className="btn-secondary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
              <button className="btn-primary" onClick={openCreate}>+ New Task</button>
              <button className="btn-danger" onClick={deleteProject}>Delete</button>
            </>
          )}
          {!isProjectAdmin() && (
            <button className="btn-primary" onClick={openCreate}>+ New Task</button>
          )}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="overdue-banner">
          ⚠️ {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
        </div>
      )}

      <div className="tabs">
        {['tasks', 'members'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div className="kanban">
          {['todo', 'in_progress', 'done'].map(status => (
            <div key={status} className="kanban-col">
              <div className="col-header">
                <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
                <span className="col-count">{grouped[status].length}</span>
              </div>
              <div className="col-tasks">
                {grouped[status].map(task => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <p className="task-card-title">{task.title}</p>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="task-card-desc">{task.description}</p>}
                    <div className="task-card-footer">
                      <div>
                        {task.assignee && <span className="assignee">👤 {task.assignee.name}</span>}
                        {task.dueDate && (
                          <span className={`due ${task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done' ? 'overdue' : ''}`}>
                            📅 {task.dueDate}
                          </span>
                        )}
                      </div>
                      <div className="task-actions">
                        {status !== 'done' && (
                          <button className="mini-btn" onClick={() => quickStatus(task, status === 'todo' ? 'in_progress' : 'done')}>
                            {status === 'todo' ? '▶' : '✓'}
                          </button>
                        )}
                        <button className="mini-btn" onClick={() => openEdit(task)}>✏️</button>
                        {isProjectAdmin() && (
                          <button className="mini-btn danger" onClick={() => deleteTask(task.id)}>🗑</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {grouped[status].length === 0 && <p className="col-empty">No tasks</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div className="members-list">
          {project.members?.map(member => (
            <div key={member.id} className="member-row card">
              <div className="member-info">
                <div className="avatar sm">{member.name[0].toUpperCase()}</div>
                <div>
                  <p className="member-name">{member.name} {member.id === user.id ? '(you)' : ''}</p>
                  <p className="member-email">{member.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge badge-${member.ProjectMember?.role || 'member'}`}>
                  {member.ProjectMember?.role || 'member'}
                </span>
                {isProjectAdmin() && member.id !== user.id && (
                  <button className="mini-btn danger" onClick={async () => {
                    await axios.delete(`${API}/api/projects/${id}/members/${member.id}`);
                    fetchProject();
                  }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editTask ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={submitTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Title *</label>
                <input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assignee</label>
                  <select value={taskForm.assigneeId} onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              {taskError && <p className="error">{taskError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Member</h2>
            <form onSubmit={addMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Email address</label>
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="teammate@example.com" required />
              </div>
              <div className="form-group">
                <label>Role in project</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {memberError && <p className="error">{memberError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
