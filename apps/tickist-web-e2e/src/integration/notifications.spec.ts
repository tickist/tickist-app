import {createFirebase, login, logout, removeOldFirebaseData} from '../support/utils';
import {Notification} from '@data';
import {createUniqueId} from '@tickist/utils';
import {addDays} from 'date-fns';
import firebase from 'firebase';
import Timestamp = firebase.firestore.Timestamp;

describe('Notifications feature', () => {

    beforeEach(() => {
        login();
        createFirebase();
        createNotification();
        cy.visit('/');
    });

    afterEach(() => {
        logout();
    });

    it('should see icon notification with notification counter', () => {
        cy.get('tickist-notifications-icon', {timeout: 20000}).should('be.visible');
        cy.get('tickist-notifications-icon', {timeout: 20000}).should('contain', 3);
        cy.log('Click on notification icon');
        cy.get('[data-cy="notification-icon"]').click();
        cy.log('see all notifications');
        cy.get('tickist-notification').should('have.length', 3);
        cy.get('tickist-notification').each(($notification, index) => {
            expect($notification.find('.notification-title')).to.contain(`Notification ${index + 1}`);
            expect($notification.find('.notification-description')).to.contain(`Description of the notification`);
            // tslint:disable-next-line:no-unused-expression
            expect($notification.find('[data-cy="unread-notification"]').first()).to.be.exist;
            // tslint:disable-next-line:no-unused-expression
            expect($notification.find('[data-cy="read-notification"]').first()).not.to.be.exist;
        });

        cy.get('[data-cy="markAllAs"]').click();
        cy.get('tickist-notifications-icon').should('contain', 0);
        cy.get('tickist-notification').each(($notification, index) => {
            // tslint:disable-next-line:no-unused-expression
            expect($notification.find('[data-cy="read-notification"]').first()).to.be.exist;
        });
        cy.log('unread again');
        cy.get('tickist-notification').each(($notification) => {
            // tslint:disable-next-line:no-unused-expression
            cy.wrap($notification.find('[data-cy="read-notification"]')).first().click();
        });
        cy.get('tickist-notifications-icon').should('contain', 3);
    });
});

function createNotification() {
    const uid = Cypress.env('TEST_UID');
    const notifications = [
        new Notification({
            id: createUniqueId(),
            recipient: uid as unknown as string,
            title: 'Notification 1',
            description: 'Description of the notification',
            isRead: false,
            type: 'notificationType1',
            date: {seconds: 1578009600} as Timestamp
        }),

        new Notification({
            id: createUniqueId(),
            recipient: uid as unknown as string,
            title: 'Notification 2',
            description: 'Description of the notification 2',
            isRead: false,
            type: 'notificationType1',
            date: {seconds: 1577923200} as Timestamp
        }),

        new Notification({
            id: createUniqueId(),
            recipient: uid as unknown as string,
            title: 'Notification 3',
            description: 'Description of the notification 3',
            isRead: false,
            type: 'notificationType1',
            date: {seconds: 1577836800} as Timestamp
        })
    ];
    notifications.forEach(notification => {
        cy.callFirestore('set', `notifications/${notification.id}`, JSON.parse(JSON.stringify(notification)));
    });
}
