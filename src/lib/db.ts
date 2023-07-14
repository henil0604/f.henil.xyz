import NablaClient from "nabladb";
import Filic from 'filic';

export const client = NablaClient.create({
    autoInit: true,
});

const fs = Filic.create();

export const db = client.db("f-henil-xyz")

db.create();

export const files = db.collection("files");

files.create();

export const hashes = db.collection("hashes");

hashes.create();

export const $uploads = fs.openDir("uploads");

try {
    $uploads.createSync();
} catch { }