const handler = require("./handler");
const providerFactory = require("../providers/provider-factory");
const orgSchema = require("../schemas/organization-schema.json");
const timeEntrySchema = require("../schemas/time-entry-schema.json");
const officeSchema = require("../schemas/office-schema.json");
const invoiceSchema = require("../schemas/invoice-schema.json");
const querystringSchema = require("../schemas/querystring-schema.json");
const filterProvider = require("../providers/filter-provider");
const authorizationService = require("../services/authorization-service");
const helper = require("../helpers/handlerHelper");

const schemas = {
    "/time-entries": timeEntrySchema,
    "/organizations": orgSchema,
    "/offices": officeSchema,
    "/invoices": invoiceSchema
};

function getCollectionName(resource) {
    const collectionNames = {
        "/time-entries": "time-entries",
        "/time-entries/{id}": "time-entries",
        "/organizations": "organizations",
        "/organizations/{id}": "organizations",
        "/offices": "offices",
        "/offices/{id}": "offices",
        "/users": "users",
        "/invoices": "invoices",
        "/invoices/{id}": "invoices",
        "/me/organizations": "organizations"
    };
    return collectionNames[resource];
}

function getSchema(resource) {
    return schemas[resource];
}

function create(event, context, callback) {
    const jsonContents = JSON.parse(event.body);
    if (event.requestContext.authorizer && event.requestContext.authorizer.principalId) {
        // assign principal id to owner
        Object.assign(jsonContents, {
            owner: { id: event.requestContext.authorizer.principalId }
        });
    }

    // validate access
    authorizationService.hasCreateAccess(
        event.resource,
        event.requestContext.authorizer,
        jsonContents
    ).then((hasAccess) => {
        if (!hasAccess) {
            helper.handleForbidden(callback)();
        } else {
            const schema = getSchema(event.resource);

            const collectionName = getCollectionName(event.resource);
            const provider = providerFactory(event.resource).create(collectionName);

            handler.create(jsonContents, provider, schema, context, callback);
        }
    });
}

function get(event, context, callback) {
    const collectionName = getCollectionName(event.resource);
    const provider = providerFactory(event.resource).create(collectionName);
    const qs = event.queryStringParameters || { };
    const filter = filterProvider(qs, event.resource, event.requestContext.authorizer);
    Object.assign(qs, {
        filter
    });
    handler.get(qs, provider, querystringSchema, context, callback);
}

function getById(event, context, callback) {
    const collectionName = getCollectionName(event.resource);
    const provider = providerFactory(event.resource).create(collectionName);
    handler.getById(event, provider, context, callback);
}

function remove(event, context, callback) {
    const collectionName = getCollectionName(event.resource);
    const provider = providerFactory(event.resource).create(collectionName);
    handler.remove(event, provider, context, callback);
}

module.exports = {
    create,
    get,
    getById,
    remove
};
