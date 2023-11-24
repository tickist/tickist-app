import * as functions from "firebase-functions";

export const onDeleteProject = functions.firestore.document("projects/{projectId}").onDelete(async () => {
    console.log("Running onDeleteProject trigger ...");
    console.log("You should never see this log message");
});
