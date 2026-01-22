# Firestore Configuration & Troubleshooting

## ✅ Current Setup

### Collection Structure (Nested)
```
Firestore Database
├── users/
│   └── {userId}/
│       ├── products/
│       │   ├── product-1
│       │   ├── product-2
│       │   └── ...
│       ├── stockEntries/
│       │   ├── entry-1
│       │   ├── entry-2
│       │   └── ...
│       └── sales/
│           ├── sale-1
│           ├── sale-2
│           └── ...
```

**Benefits:**
- ✅ Writes never need `where` clauses (performance++)
- ✅ Rules can be based on path (`users/{uid}`)
- ✅ Automatic user isolation
- ✅ No need to store `userId` field in documents

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      match /products/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
      match /stockEntries/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
      match /sales/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
    }
  }
}
```

**Key Points:**
- ✅ User can only access their own data
- ✅ All writes use nested collection paths
- ✅ No `userId` field needed in documents
- ✅ Auth must be ready before writes

## 🔧 Setup Checklist

### 1. Firebase Console Configuration
- [ ] Go to **Firestore Database** > **Rules**
- [ ] Replace with rules above
- [ ] Click **Publish**
- [ ] Verify no errors

### 2. Verify Collections (Optional)
- [ ] Go to **Firestore Database** > **Data**
- [ ] Should show empty database (first time)
- [ ] After login & adding product, should see:
  ```
  users/
  └── {your-user-id}/
      └── products/
          └── {product-doc}
  ```

### 3. Test Write Operations
1. Go to `/register` and create account
2. Go to `/login` and login
3. Add a product via UI
4. Check Firestore console - should appear under `users/{uid}/products/`

## 🐛 Troubleshooting Write Failures

### Error: "Missing or insufficient permissions"
**Cause:** Security rules blocking writes
**Solutions:**
- [ ] Check rules are published (see "Rules" tab)
- [ ] Verify user is authenticated (`console.log(user)` in auth context)
- [ ] Check collection path matches: `users/{uid}/products`
- [ ] Ensure `user.uid` exists (not null)

### Error: "Document path does not exist"
**Cause:** Trying to write to wrong collection
**Solution:**
- [ ] Verify path is `users/{uid}/collection/document`
- [ ] NOT `products/document` (old structure)

### Products don't load after login
**Cause:** Auth not ready or listeners fail
**Solutions:**
- [ ] Check `user.uid` is available in console
- [ ] Verify listeners are subscribed (check network tab)
- [ ] Check Firestore for data under correct path

## 📋 Code Structure

### Files Involved
- `src/services/firestoreService.ts` - CRUD operations with nested paths
- `src/contexts/InventoryContext.tsx` - Subscriptions to real-time updates
- `src/contexts/AuthContext.tsx` - User authentication state

### Key Functions
```typescript
// All operations use nested paths automatically
addProduct(userId, product)          // writes to users/{userId}/products
subscribeToUserProducts(userId, ...)  // listens to users/{userId}/products
deleteProduct(userId, productId)     // deletes from users/{userId}/products
```

### Validation
- ✅ `if (!userId) throw new Error('userId é obrigatório')`
- ✅ `if (!user || !user.uid)` check before operations
- ✅ Cleanup unsubscribes on logout

## ✅ Data Flow Verification

```
Login → onAuthStateChanged fires → user.uid available
  ↓
InventoryProvider useEffect runs
  ↓
subscribeToUserProducts(user.uid) called
  ↓
Firestore listener attaches to: users/{uid}/products
  ↓
If products exist → UI shows them
If no products → empty array (no error)
  ↓
Add Product → addProduct(user.uid, product)
  ↓
Document created at: users/{uid}/products/{id}
  ↓
Real-time listener fires → UI updates instantly
```

## 🔒 Important Notes

1. **Never write to old structure**
   - ❌ WRONG: `collection(db, 'products')`
   - ✅ RIGHT: `collection(db, `users/${userId}/products`)`

2. **UserId must exist**
   - Always check `if (!userId)` before operations
   - AuthContext ensures user.uid exists before access

3. **Rules are enforced**
   - Even authenticated users can only access their own data
   - Attempts to access other users' data will be blocked

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] Rules are configured in Firestore Console
- [ ] Test creating account and adding products locally
- [ ] Verify data appears under correct collection path
- [ ] Logout and login - data should persist
- [ ] Check Firestore costs (should be minimal for small writes)

## 📞 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 404 after refresh | Vercel SPA routing | ✅ `vercel.json` configured |
| Products not loading | Auth not ready | ✅ Check `user.uid` exists |
| Can't create product | Write denied | ✅ Check security rules |
| Data disappears on logout | Expected behavior | ✅ State clears, data stays in Firestore |
| Slow first load | Initial subscription | ✅ Normal, subsequent loads faster |
