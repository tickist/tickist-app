import { Injectable } from "@angular/core";
import { Tag } from "@data/tags/models/tags";
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc, updateDoc } from "@angular/fire/firestore";

const tagsCollectionName = "tags";

@Injectable({
    providedIn: "root",
})
export class TagService {
    constructor(private firestore: Firestore) {}

    async createTag(tag: Tag) {
        try {
            console.log("HERE HERE HERE HERE HERE HERE");
            const docRef = doc(collection(this.firestore, tagsCollectionName));
            await setDoc(docRef, {
                id: docRef.id,
                ...tag,
            });
        } catch (e) {
            console.error({ e });
        }
    }

    async createTagDuringEditingTask(tag: Tag) {
        try {
            const docRef = doc(collection(this.firestore, tagsCollectionName));
            await setDoc(docRef, {
                id: docRef.id,
                ...tag,
            });
            return docRef.id;
        } catch (e) {
            console.error({ e });
        }
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
