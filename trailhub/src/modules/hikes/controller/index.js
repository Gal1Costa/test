// src/modules/hikes/controller/index.js
const repo = require('../repository'); // this resolves to repository/index.js

async function getList(req, res, next) {
  try { res.json(await repo.listHikes()); }
  catch (e) { next(e); }
}

async function getOne(req, res, next) {
  try {
    const hike = await repo.getHikeById(req.params.id);
    if (!hike) return res.status(404).json({ error: 'Not found' });
    res.json(hike);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try { res.status(201).json(await repo.createHike(req.body)); }
  catch (e) { next(e); }
}

async function update(req, res, next) {
  try { res.json(await repo.updateHike(req.params.id, req.body)); }
  catch (e) { next(e); }
}

async function remove(req, res, next) {
  try { await repo.deleteHike(req.params.id); res.status(204).end(); }
  catch (e) { next(e); }
}

module.exports = { getList, getOne, create, update, remove };
