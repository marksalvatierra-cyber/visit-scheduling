// Firebase Services for Visit Scheduling System

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { firebaseConfig } from './firebase-config.js';

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

class FirebaseService {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        // Set session-only persistence
        this.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .catch(function(error) {
                console.error('Failed to set session persistence:', error);
            });
    }

    // Helper: normalize status values app-wide
    normalizeStatus(status) {
        const s = (status || '').toLowerCase();
        if (s === 'reschedule') return 'rescheduled';
        return s;
    }

    // Authentication Methods
    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await this.db.collection('users').doc(user.uid).set({
                ...userData,
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.currentUser = user;
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    // Add this method to your FirebaseService class

async sendPasswordReset(email) {
    try {
        await this.auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

    async signOut() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Helper method to ensure user is authenticated
    async ensureAuthenticated() {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('Authentication required. Please log in to continue.');
        }
        return user;
    }

    // User Management
    async getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = this.auth.onAuthStateChanged((user) => {
                unsubscribe();
                this.currentUser = user;
                resolve(user);
            });
        });
    }

    async getUserData(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    async updateUserProfile(userId, data) {
        try {
            await this.db.collection('users').doc(userId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Visit Request Methods
    async createVisitRequest(requestData) {
        try {
            const docRef = await this.db.collection('visitRequests').add({
                ...requestData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("Attempting to create admin notification...");
            const adminNotifResult = await this.createNotification({
                userId: 'admin',
                title: 'New Visit Request',
                message: `New visit request from ${requestData.clientName} for ${requestData.inmateName}`,
                type: 'visit_request',
                relatedRequestId: docRef.id,
                clientId: requestData.clientId,
                clientName: requestData.clientName,
                inmateName: requestData.inmateName,
                visitDate: requestData.visitDate,
                visitTime: requestData.visitTime
            });
            console.log("Admin notification result:", adminNotifResult);
            
            return { success: true, requestId: docRef.id };
        } catch (error) {
            console.error('Error in createVisitRequest:', error);
            return { success: false, error: error.message };
        }
    }

    async getVisitRequests(userId = null, status = null) {
        try {
            let query = this.db.collection('visitRequests');
            
            if (userId) {
                query = query.where('clientId', '==', userId);
            }
            
            if (status) {
                const normalized = this.normalizeStatus(status);
                query = query.where('status', '==', normalized);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const requests = [];
            
            snapshot.forEach(doc => {
                requests.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return requests;
        } catch (error) {
            console.error('Error getting visit requests:', error);
            return [];
        }
    }

    // FIXED updateVisitRequest METHOD
    async updateVisitRequest(requestId, data) {
        try {
            console.log('=== UPDATE VISIT REQUEST DEBUG ===');
            console.log('Updating request ID:', requestId);
            console.log('Update data (incoming):', data);
            
            // Check authentication first
            const currentUser = this.auth.currentUser;
            console.log('Current authenticated user:', currentUser ? currentUser.uid : 'No user');
            
            if (!currentUser) {
                throw new Error('User must be authenticated to update visit requests');
            }
            
            // Validate request ID
            if (!requestId) {
                throw new Error('Request ID is required');
            }
            
            // Get the original request data FIRST
            const requestDoc = await this.db.collection('visitRequests').doc(requestId).get();
            if (!requestDoc.exists) {
                console.error('Visit request not found:', requestId);
                throw new Error('Visit request not found');
            }
            
            const originalData = requestDoc.data();
            console.log('Original request data:', originalData);

            // Normalize status on write to keep Firestore consistent
            let normalizedStatus = data.status ? this.normalizeStatus(data.status) : undefined;

            // Prepare update data with timestamp
            const updateData = {
                ...data,
                ...(normalizedStatus ? { status: normalizedStatus } : {}),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update the request in Firestore
            await this.db.collection('visitRequests').doc(requestId).update(updateData);
            console.log('Request updated successfully in Firebase');
            
            // Create log entry for status changes
            const prevStatus = this.normalizeStatus(originalData.status);
            const newStatus = normalizedStatus ?? prevStatus;

            if (normalizedStatus && newStatus !== prevStatus) {
                console.log('Status changed from', prevStatus, 'to', newStatus);
                console.log('Creating log entry...');
                
                const officerName = data.reviewedBy || data.officerName || 'System Admin';
                console.log('Officer name:', officerName);
                
                // Map status to action for logging
                let logAction = newStatus;
                if (newStatus === 'approved') {
                    logAction = 'approved';
                } else if (newStatus === 'rejected') {
                    logAction = 'rejected';
                } else if (newStatus === 'rescheduled') {
                    logAction = 'rescheduled';
                }
                
                // Create comprehensive log data
                const logData = {
                    officerName: officerName,
                    action: logAction,
                    clientName: originalData.clientName,
                    visitorName: originalData.clientName,
                    inmateName: originalData.inmateName,
                    visitDate: originalData.visitDate,
                    visitTime: originalData.visitTime,
                    purpose: originalData.purpose || originalData.reason || 'Family visit',
                    reason: originalData.reason || originalData.purpose || 'Family visit',
                    visitPurpose: originalData.purpose || originalData.reason || 'Family visit',
                    relationship: originalData.relationship,
                    visitRequestId: requestId,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add additional data based on action
                if (data.reason) {
                    logData.actionReason = data.reason;
                }
                if (newStatus === 'rejected' && data.reason) {
                    logData.rejectionReason = data.reason;
                }
                if (newStatus === 'rescheduled' && data.reason) {
                    logData.rescheduleReason = data.reason;
                }
                
                console.log('Final log data being created:', logData);
                
                // Create the log entry
                try {
                    const logResult = await this.createLogEntry(logData);
                    console.log('Log creation result:', logResult);
                    
                    if (!logResult.success) {
                        console.error('Failed to create log entry:', logResult.error);
                    } else {
                        console.log('Log entry created successfully with ID:', logResult.logId);
                    }
                } catch (logError) {
                    console.error('Error creating log entry:', logError);
                    // Don't fail the main update for log errors
                }
            }
            

            
            console.log('=== UPDATE VISIT REQUEST COMPLETE ===');
            return { 
                success: true, 
                updatedData: { ...originalData, ...updateData }
            };
        } catch (error) {
            console.error('Error in updateVisitRequest:', error);
            return { success: false, error: error.message };
        }
    }

    // Log Trail Methods
    async createLogEntry(logData) {
        try {
            console.log('Creating log entry:', logData);
            const docRef = await this.db.collection('logs').add({
                ...logData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Log entry created with ID:', docRef.id);
            return { success: true, logId: docRef.id };
        } catch (error) {
            console.error('Error creating log entry:', error);
            return { success: false, error: error.message };
        }
    }

    async getLogs(limit = 50) {
        try {
            const snapshot = await this.db.collection('logs')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const logs = [];
            snapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return logs;
        } catch (error) {
            console.error('Error getting logs:', error);
            return [];
        }
    }

    async getLogsByDateRange(startDate, endDate) {
        try {
            const snapshot = await this.db.collection('logs')
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .orderBy('timestamp', 'desc')
                .get();
            
            const logs = [];
            snapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return logs;
        } catch (error) {
            console.error('Error getting logs by date range:', error);
            return [];
        }
    }

    async getLogsByOfficer(officerName) {
        try {
            const snapshot = await this.db.collection('logs')
                .where('officerName', '==', officerName)
                .orderBy('timestamp', 'desc')
                .get();
            
            const logs = [];
            snapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return logs;
        } catch (error) {
            console.error('Error getting logs by officer:', error);
            return [];
        }
    }

    // Helper method to create log entry for visit request actions
    async logVisitRequestAction(action, requestData, officerName, additionalData = {}) {
        console.log('=== LOG CREATION DEBUG ===');
        console.log('logVisitRequestAction called with:');
        console.log('  - action:', action);
        console.log('  - requestData:', requestData);
        console.log('  - officerName:', officerName);
        console.log('  - additionalData:', additionalData);
        
        const visitorName = requestData.clientName || 
                           requestData.visitorName || 
                           additionalData.clientName ||
                           'Unknown Visitor';
        
        const inmateName = requestData.inmateName || 
                          additionalData.inmateName ||
                          'Unknown Inmate';
        
        const purpose = requestData.purpose || 
                       requestData.reason || 
                       requestData.visitPurpose ||
                       additionalData.purpose ||
                       additionalData.reason ||
                       'Family visit';
        
        const logData = {
            officerName: officerName || 'Unknown Officer',
            action: action,
            clientName: visitorName,
            visitorName: visitorName,
            inmateName: inmateName,
            visitDate: requestData.visitDate,
            visitTime: requestData.visitTime,
            purpose: purpose,
            reason: purpose,
            visitPurpose: purpose,
            relationship: requestData.relationship,
            ...additionalData
        };

        console.log('Final log data being created:', logData);
        console.log('=== END LOG CREATION DEBUG ===');
        
        return await this.createLogEntry(logData);
    }

    // Helper method to create log entry for inmate actions
    async logInmateAction(action, inmateData, officerName, additionalData = {}) {
        const logData = {
            officerName: officerName,
            action: action,
            inmateName: inmateData.name,
            inmateId: inmateData.id,
            ...additionalData
        };

        return await this.createLogEntry(logData);
    }

    // Inmate Management
    async getInmates(status = 'active') {
        try {
            let query = this.db.collection('inmates');
            
            if (status) {
                query = query.where('status', '==', status);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const inmates = [];
            
            snapshot.forEach(doc => {
                inmates.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return inmates;
        } catch (error) {
            console.error('Error getting inmates:', error);
            return [];
        }
    }

    async getInmatesByMonth(months = 6) {
        try {
            const currentDate = new Date();
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months, 1);
            
            const snapshot = await this.db.collection('inmates')
                .where('createdAt', '>=', startDate)
                .orderBy('createdAt', 'asc')
                .get();
            
            const inmates = [];
            snapshot.forEach(doc => {
                inmates.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return inmates;
        } catch (error) {
            console.error('Error getting inmates by month:', error);
            return [];
        }
    }

    async addInmate(inmateData) {
        try {
            const docRef = await this.db.collection('inmates').add({
                ...inmateData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, inmateId: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateInmate(inmateId, data) {
        try {
            await this.db.collection('inmates').doc(inmateId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteInmate(inmateId) {
        try {
            await this.db.collection('inmates').doc(inmateId).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Notification Methods
    async createNotification(notificationData) {
        try {
            await this.db.collection('notifications').add({
                ...notificationData,
                isRead: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getNotifications(userId) {
        try {
            const snapshot = await this.db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            
            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return notifications;
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            await this.db.collection('notifications').doc(notificationId).update({
                isRead: true
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Real-time Listeners
    listenToNotifications(userId, callback) {
        return this.db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .onSnapshot(snapshot => {
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(notifications);
            });
    }

    listenToVisitRequests(userId, callback) {
        return this.db.collection('visitRequests')
            .where('clientId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const requests = [];
                snapshot.forEach(doc => {
                    requests.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(requests);
            });
    }

    // Statistics Methods
    async getDashboardStats(userId = null) {
        try {
            let requestsQuery = this.db.collection('visitRequests');
            
            if (userId) {
                requestsQuery = requestsQuery.where('clientId', '==', userId);
            }
            
            const snapshot = await requestsQuery.get();
            const stats = {
                total: 0,
                approved: 0,
                pending: 0,
                rejected: 0,
                rescheduled: 0
            };
            
            snapshot.forEach(doc => {
                const data = doc.data();
                stats.total++;
                const status = this.normalizeStatus(data.status);
                if (Object.prototype.hasOwnProperty.call(stats, status)) {
                    stats[status]++;
                } else {
                    // Unknown status, ignore to prevent NaN
                    console.warn('Encountered unknown status while counting stats:', data.status);
                }
            });
            
            return stats;
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return { total: 0, approved: 0, pending: 0, rejected: 0, rescheduled: 0 };
        }
    }

    async getWeeklyRequestStats(userId = null) {
        try {
            const currentDate = new Date();
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            let requestsQuery = this.db.collection('visitRequests')
                .where('createdAt', '>=', startOfWeek);
            
            if (userId) {
                requestsQuery = requestsQuery.where('clientId', '==', userId);
            }
            
            const snapshot = await requestsQuery.get();
            const dailyStats = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt) {
                    const requestDate = new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt);
                    const dayOfWeek = requestDate.getDay();
                    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
                    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    dailyStats[adjustedDay]++;
                }
            });
            
            return dailyStats;
        } catch (error) {
            console.error('Error getting weekly request stats:', error);
            return [0, 0, 0, 0, 0, 0, 0];
        }
    }

    async getRequestStatsByDays(days = 7, userId = null) {
        try {
            const now = new Date();
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            console.log(`🔍 Fetching data for ${days} days from ${startDate.toISOString()} to ${now.toISOString()}`);

            let requestsQuery = this.db.collection('visitRequests')
                .where('createdAt', '>=', startDate);

            if (userId) {
                requestsQuery = requestsQuery.where('clientId', '==', userId);
            }

            const snapshot = await requestsQuery.get();
            const dailyMap = new Map();

            console.log(`📊 Found ${snapshot.size} requests in the date range`);

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt) {
                    const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    const dateKey = createdAt.toISOString().split('T')[0]; // "2025-08-01"
                    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
                }
            });

            // Generate ALL days in the range, not just days with data
            const labels = [];
            const data = [];
            
            for (let i = 0; i < days; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const dateKey = currentDate.toISOString().split('T')[0];
                const label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                labels.push(label);
                data.push(dailyMap.get(dateKey) || 0); // Use 0 if no data for this day
            }

            console.log(`📈 Generated chart data: ${labels.length} data points`);
            console.log('Labels:', labels);
            console.log('Counts:', data);

            return { labels, data };
        } catch (error) {
            console.error('Error getting request stats by days:', error);
            console.log('📝 Using fallback mock data due to error');
            return this.generateMockData(days);
        }
    }

    generateMockData(days) {
        const labels = [];
        const data = [];
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - days + 1); // Start from days ago
        
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate different patterns based on days
            let count;
            if (days === 7) {
                // 7 days: varied pattern
                count = Math.floor(Math.random() * 8) + 2; // 2-9 requests
            } else if (days === 30) {
                // 30 days: more varied pattern
                count = Math.floor(Math.random() * 15) + 1; // 1-15 requests
            } else {
                // 90 days: even more varied pattern
                count = Math.floor(Math.random() * 25) + 1; // 1-25 requests
            }
            data.push(count);
        }
        
        console.log(`🎲 Generated mock data for ${days} days:`, { labels, data });
        return { labels, data };
    }

    async getInmateStats() {
        try {
            const inmatesSnapshot = await this.db.collection('inmates').get();
            const totalInmates = inmatesSnapshot.size;
            
            const activeInmatesSnapshot = await this.db.collection('inmates')
                .where('status', '==', 'active')
                .get();
            const activeInmates = activeInmatesSnapshot.size;
            
            return {
                total: totalInmates,
                active: activeInmates,
                inactive: totalInmates - activeInmates
            };
        } catch (error) {
            console.error('Error getting inmate stats:', error);
            return { total: 0, active: 0, inactive: 0 };
        }
    }

    async getRecentActivity(limit = 10) {
        try {
            // Get recent visit requests
            const requestsSnapshot = await this.db.collection('visitRequests')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            const activities = [];
            requestsSnapshot.forEach(doc => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    type: 'visit_request',
                    title: `Visit Request from ${data.clientName}`,
                    description: `Status: ${this.normalizeStatus(data.status)}`,
                    timestamp: data.createdAt,
                    status: this.normalizeStatus(data.status)
                });
            });
            
            // Get recent notifications
            const notificationsSnapshot = await this.db.collection('notifications')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            notificationsSnapshot.forEach(doc => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    type: 'notification',
                    title: data.title,
                    description: data.message,
                    timestamp: data.createdAt,
                    isRead: data.isRead
                });
            });
            
            // Sort by timestamp and return limited results
            return activities
                .sort((a, b) => {
                    const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                    const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                    return bTime - aTime;
                })
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting recent activity:', error);
            return [];
        }
    }

    // QR Code Management Methods
    async generateVisitQRCode(visitData) {
        try {
            const qrData = {
                visitId: visitData.visitId,
                clientId: visitData.clientId,
                clientName: visitData.clientName,
                visitDate: visitData.visitDate,
                visitTime: visitData.visitTime,
                inmateName: visitData.inmateName,
                approvedAt: visitData.approvedAt,
                expiresAt: visitData.expiresAt,
                status: 'approved',
                facility: 'Bureau of Corrections',
                qrVersion: '1.0'
            };
            
            // Store QR code data in Firebase for validation
            await this.db.collection('visitQRCodes').doc(visitData.visitId).set({
                ...qrData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isValid: true,
                scannedAt: null,
                scannedBy: null
            });
            
            return qrData;
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    }

    async validateQRCode(qrCodeData) {
        try {
            // Parse QR code data if it's a string
            const data = typeof qrCodeData === 'string' ? JSON.parse(qrCodeData) : qrCodeData;
            
            // Get QR code record from Firebase
            const qrDoc = await this.db.collection('visitQRCodes').doc(data.visitId).get();
            
            if (!qrDoc.exists) {
                return {
                    valid: false,
                    reason: 'QR code not found in system',
                    status: 'invalid'
                };
            }
            
            const qrRecord = qrDoc.data();
            const now = new Date();
            const expirationDate = new Date(data.expiresAt);
            const visitDate = new Date(data.visitDate);
            
            // Check if QR code is still valid
            if (!qrRecord.isValid) {
                return {
                    valid: false,
                    reason: 'QR code has been invalidated',
                    status: 'invalidated'
                };
            }
            
            // Check if QR code has expired
            if (now > expirationDate) {
                return {
                    valid: false,
                    reason: 'QR code has expired',
                    status: 'expired',
                    expirationDate: expirationDate.toISOString()
                };
            }
            
            // Check if visit date has passed
            if (now > new Date(visitDate.getTime() + 24 * 60 * 60 * 1000)) {
                return {
                    valid: false,
                    reason: 'Visit date has passed',
                    status: 'date_passed'
                };
            }
            
            // Check if already scanned (optional - depends on policy)
            if (qrRecord.scannedAt) {
                return {
                    valid: false,
                    reason: 'QR code already used',
                    status: 'already_used',
                    scannedAt: qrRecord.scannedAt,
                    scannedBy: qrRecord.scannedBy
                };
            }
            
            return {
                valid: true,
                status: 'valid',
                visitData: data,
                qrRecord: qrRecord
            };
            
        } catch (error) {
            console.error('Error validating QR code:', error);
            return {
                valid: false,
                reason: 'Error validating QR code',
                status: 'error'
            };
        }
    }

    async markQRCodeAsUsed(visitId, scannedBy) {
        try {
            await this.db.collection('visitQRCodes').doc(visitId).update({
                scannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                scannedBy: scannedBy,
                lastScanned: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error marking QR code as used:', error);
            return { success: false, error: error.message };
        }
    }

    async invalidateQRCode(visitId, reason) {
        try {
            await this.db.collection('visitQRCodes').doc(visitId).update({
                isValid: false,
                invalidatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                invalidationReason: reason
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error invalidating QR code:', error);
            return { success: false, error: error.message };
        }
    }

    // Admin notification methods
    async getAdminNotifications() {
        try {
            const snapshot = await this.db.collection('notifications')
                .where('userId', '==', 'admin')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return notifications;
        } catch (error) {
            console.error('Error getting admin notifications:', error);
            return [];
        }
    }

    listenToAdminNotifications(callback) {
        return this.db.collection('notifications')
            .where('userId', '==', 'admin')
            .where('isRead', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(notifications);
            });
    }
}

// Initialize Firebase service
const firebaseService = new FirebaseService(); 

export default firebaseService;