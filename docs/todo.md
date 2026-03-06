# TODO: Add Vehicle Brand/Model and Indian Vehicle Number Validation

## Tasks
- [x] 1. Modify AddVehicleDialog.tsx - Add brand/model dropdowns and vehicle number validation
- [x] 2. Modify Home.tsx - Pass actual brand/model to onAddVehicle instead of generic type
- [x] 3. Test the implementation

## Details
- Add brand dropdown (two-wheeler: Hero, Honda, TVS, Bajaj, Royal Enfield, Yamaha, Suzuki, KTM; four-wheeler: Maruti, Hyundai, Honda, Toyota, Tata, Mahindra, Kia, Volkswagen, Ford)
- Add model dropdown that populates based on selected brand
- Validate Indian vehicle number format: XX-00-XX-0000 (e.g., MH-12-AB-1234)
- Show validation error if format is invalid

