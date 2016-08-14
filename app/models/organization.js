const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const Schema = mongoose.Schema;

const connectionString = 'mongodb://localhost:27017/bizhub';
const connection = mongoose.createConnection(connectionString);

autoIncrement.initialize(connection);

const OrganizationSchema = Schema({
    name: String
}, { versionKey: false });

OrganizationSchema.set('toObject', { getters: true });

OrganizationSchema.virtual('url').get(() => `/organizations/${this.id}`);

OrganizationSchema.virtual('offices_url').get(`/organizations/${this.id}/offices`);

OrganizationSchema.plugin(autoIncrement.plugin, {
    model: 'organizations',
    startAt: 1
});

module.exports = mongoose.model('organizations', OrganizationSchema);
