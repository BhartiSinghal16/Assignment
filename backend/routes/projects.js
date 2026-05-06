const router = require('express').Router();
const { Op } = require('sequelize');
const { Project, User, ProjectMember, Task } = require('../models');
const { authenticate, requireProjectAdmin } = require('../middleware/auth');

// All routes require login
router.use(authenticate);

// GET /api/projects — get all projects user is part of
router.get('/', async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({ where: { userId: req.user.id } });
    const projectIds = memberships.map(m => m.projectId);

    // Also include projects user owns
    const ownedProjects = await Project.findAll({ where: { ownerId: req.user.id } });
    const ownedIds = ownedProjects.map(p => p.id);

    const allIds = [...new Set([...projectIds, ...ownedIds])];
    const projects = await Project.findAll({
      where: { id: { [Op.in]: allIds } },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
      ],
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects — create project (any logged-in user)
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const project = await Project.create({ name, description, ownerId: req.user.id });

    // Add creator as project admin
    await ProjectMember.create({ projectId: project.id, userId: req.user.id, role: 'admin' });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
        {
          model: Task, as: 'tasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
        },
      ],
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id — project admin or global admin
router.delete('/:id', requireProjectAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/members — add member (project admin)
router.post('/:id/members', requireProjectAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await ProjectMember.findOne({
      where: { projectId: req.params.id, userId: user.id },
    });
    if (existing) return res.status(409).json({ message: 'User already a member' });

    await ProjectMember.create({
      projectId: req.params.id,
      userId: user.id,
      role: role || 'member',
    });
    res.status(201).json({ message: 'Member added', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', requireProjectAdmin, async (req, res) => {
  try {
    await ProjectMember.destroy({
      where: { projectId: req.params.id, userId: req.params.userId },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
