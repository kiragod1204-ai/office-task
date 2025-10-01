# Dropdown Selection Fix for Document Forms

## Problem
When creating incoming or outgoing documents, the "Đơn vị ban hành" (Issuing Unit) and "Loại văn bản" (Document Type) dropdown selections were not working properly. Users could select options but they would not stay selected.

## Root Cause
The issue was in the form state initialization and dropdown component logic:

1. **Form State Initialization**: Forms were initializing dropdown values to `0` instead of `undefined`
2. **Dropdown Value Handling**: Select components were not properly handling the `0` value vs empty state
3. **API Response Structure**: Components needed better error handling for API responses

## Solution

### 1. Fixed Form State Initialization

**Before:**
```typescript
const [formData, setFormData] = useState({
  document_type_id: 0,
  issuing_unit_id: 0,
  // ...
});
```

**After:**
```typescript
const [formData, setFormData] = useState({
  document_type_id: undefined as number | undefined,
  issuing_unit_id: undefined as number | undefined,
  // ...
});
```

### 2. Updated Dropdown Components

**Fixed in all select components:**
- `DocumentTypeSelect.tsx`
- `IssuingUnitSelect.tsx` 
- `ReceivingUnitSelect.tsx`

**Changes made:**
- Improved `handleChange` logic to only call `onChange` for valid selections
- Fixed `value` prop to handle `undefined` properly
- Added better error handling and logging for API responses
- Added fallback for different API response structures

**Before:**
```typescript
const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedValue = parseInt(e.target.value);
  if (!isNaN(selectedValue)) {
    onChange(selectedValue);
  }
};

// ...
<select value={value || ''}>
```

**After:**
```typescript
const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedValue = parseInt(e.target.value);
  if (!isNaN(selectedValue) && selectedValue > 0) {
    onChange(selectedValue);
  }
};

// ...
<select value={value && value > 0 ? value : ''}>
```

### 3. Enhanced API Response Handling

Added robust handling for different API response structures:

```typescript
const loadDocumentTypes = async () => {
  try {
    setLoading(true);
    const response = await documentTypeApi.getAll();
    console.log('Document types response:', response);
    
    // Handle different response structures
    const data = response.data?.data || response.data || [];
    setDocumentTypes(data);
  } catch (error) {
    console.error('Error loading document types:', error);
    setDocumentTypes([]);
  } finally {
    setLoading(false);
  }
};
```

### 4. Fixed Form Validation

Updated validation to handle both `undefined` and `0` values:

**Before:**
```typescript
if (!formData.document_type_id) {
  newErrors.document_type_id = 'Loại văn bản là bắt buộc';
}
```

**After:**
```typescript
if (!formData.document_type_id || formData.document_type_id === 0) {
  newErrors.document_type_id = 'Loại văn bản là bắt buộc';
}
```

### 5. Fixed Form Submission

Ensured proper data conversion before API submission:

```typescript
const submitData = {
  ...formData,
  document_type_id: formData.document_type_id || 0,
  issuing_unit_id: formData.issuing_unit_id || 0,
  processor_id: formData.processor_id || undefined,
};
```

## Files Modified

### Frontend Components:
- `frontend/src/components/common/DocumentTypeSelect.tsx`
- `frontend/src/components/common/IssuingUnitSelect.tsx`
- `frontend/src/components/common/ReceivingUnitSelect.tsx`
- `frontend/src/components/incoming-documents/IncomingDocumentForm.tsx`
- `frontend/src/components/outgoing-documents/OutgoingDocumentForm.tsx`

## Testing Steps

### For Incoming Documents:
1. **Login** as Secretary (`secretary` / `secretary123`)
2. **Navigate** to "Văn bản đến"
3. **Click** "Thêm văn bản đến mới"
4. **Test dropdown selections:**
   - Click "Loại văn bản" dropdown
   - Select an option (e.g., "Thông báo")
   - Verify the selection stays selected
   - Click "Đơn vị ban hành" dropdown
   - Select an option (e.g., "UBND Tỉnh")
   - Verify the selection stays selected
5. **Fill other required fields** and submit
6. **Verify** document creation works

### For Outgoing Documents:
1. **Navigate** to "Văn bản đi"
2. **Click** "Thêm văn bản đi mới"
3. **Test dropdown selections** (same as above)
4. **Verify** all dropdowns work properly

## Expected Behavior

✅ **Dropdown selections should now:**
- Display available options when clicked
- Retain selected values after selection
- Show the selected option text in the dropdown
- Validate properly on form submission
- Submit correct values to the backend API

✅ **Console logging added for debugging:**
- API responses are logged to browser console
- Error handling provides clear error messages
- Loading states work properly

## API Endpoints Used
- `GET /api/document-types` - Load document types
- `GET /api/issuing-units` - Load issuing units  
- `GET /api/receiving-units` - Load receiving units

## Troubleshooting

If dropdowns still don't work:

1. **Check browser console** for API errors or response structure issues
2. **Verify backend is running** and endpoints are accessible
3. **Check user permissions** - ensure Secretary role has access to configuration APIs
4. **Test API endpoints directly** in browser or Postman:
   - `http://localhost:9090/api/document-types`
   - `http://localhost:9090/api/issuing-units`

The dropdown selection issue should now be completely resolved for both incoming and outgoing document forms.