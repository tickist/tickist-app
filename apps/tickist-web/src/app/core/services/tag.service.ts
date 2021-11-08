import { Injectable } from "@angular/core";
import { Tag } from "@data/tags/models/tags";
import { AngularFirestore } from "@angular/fire/firestore";

const tagsCollectionName = "tags";

@Injectable({
    providedIn: "root",
})
export class TagService {
    constructor(private db: AngularFirestore) {}

    saveTag(tag: Tag) {
        if (tag.id) {
            this.updateTag(tag);
        } else {
            this.createTag(tag);
        }
    }

    createTag(tag: Tag) {
        const newTagRef = this.db.collection(tagsCollectionName).ref.doc();
        return newTagRef.set({ ...tag, id: newTagRef.id });
    }

    createTagDuringEditingTask(tag: Tag) {
        const newTagRef = this.db.collection(tagsCollectionName).ref.doc();
        return this.createTag(tag).then(() => newTagRef.id);
    }

    updateTag(tag: Tag) {
        return this.db
            .collection(tagsCollectionName)
            .doc(tag.id)
            .update({ ...tag });
    }

    deleteTag(tagId: string) {
        return this.db.collection(tagsCollectionName).doc(tagId).delete();
    }
}
