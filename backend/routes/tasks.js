const router = require('express').Router();
const { Task, User, Project, ProjectMember } = require('../models');
const { authenticate, requireProjectAdmin } = require('../middleware/auth');

router.use(authenticate);

// Helper: check if user is member of a project
const isMember = async (projectId, userId) => {
  const m = await ProjectMember.findOne({ where: { projectId, userId } });
  return !!m;
};

// GET /api/projects/:projectId/tasks — via project router
router.get('/project/:projectId', async (req, res) => {
  try {
    const member = await isMember(req.params.projectId, req.user.id);
    if (!member && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not a project member' });

    const tasks = await Task.findAll({
      where: { projectId: req.params.projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks — create task
router.post('/', async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, priority, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ message: 'Title and projectId required' });

    const member = await isMember(projectId, req.user.id);
    if (!member && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not a project member' });

    const task = await Task.create({
      title, description, projectId,
      assigneeId: assigneeId || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      creatorId: req.user.id,
    });

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id — update task
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await isMember(task.projectId, req.user.id);
    if (!member && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not a project member' });

    const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
    await task.save();

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — admin only
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check project admin or global admin
    const membership = await ProjectMember.findOne({
      where: { projectId: task.projectId, userId: req.user.id, role: 'admin' },
    });
    if (!membership && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required to delete tasks' });

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
