import { Injectable } from "@angular/core";
import { Tag } from "@data/tags/models/tags";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    Firestore,
    setDoc,
    updateDoc,
} from "@angular/fire/firestore";

const tagsCollectionName = "tags";

@Injectable({
    providedIn: "root",
})
export class TagService {
    constructor(private firestore: Firestore) {}

    async createTag(tag: Tag) {
        console.log("HERE HERE HERE HERE HERE HERE");
        const docRef = doc(collection(this.firestore, tagsCollectionName));
        // const newTagRef = this.db.collection(tagsCollectionName).ref.doc();
        // return newTagRef.set({ ...tag, id: newTagRef.id });
        // const docRef = doc(this.firestore, `${tagsCollectionName}`);
        // await setDoc(docRef, { ...tag, id: docRef.id });
        await setDoc(docRef, {
            id: docRef.id,
            ...tag,
        });
    }

    createTagDuringEditingTask(tag: Tag) {
        console.log("HERE HERE HERE HERE HERE HERE");
        const docRef = doc(this.firestore, `${tagsCollectionName}`);
        // const newTagRef = this.db.collection(tagsCollectionName).ref.doc();
        return this.createTag(tag).then(() => docRef.id);
    }

    async updateTag(tag: Tag) {
        console.log("HERE HERE HERE HERE HERE HERE");
        const docRef = doc(this.firestore, `${tagsCollectionName}/${tag.id}`);
        await updateDoc(docRef, { ...tag, modificationDate: new Date() });
        // return this.db
        //     .collection(tagsCollectionName)
        //     .doc(tag.id)
        //     .update({ ...tag });
    }

    async deleteTag(tagId: string) {
        console.log("HERE HERE HERE HERE HERE HERE");
        const docRef = doc(this.firestore, `${tagsCollectionName}/${tagId}`);
        await deleteDoc(docRef);
        // return this.db.collection(tagsCollectionName).doc(tagId).delete();
    }
}
