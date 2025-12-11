# Feature 2.3.3: Xem Lịch Sử Mượn Sách

## Mô tả
Cho phép độc giả xem lịch sử các đơn mượn sách của mình, bao gồm: đang mượn, đã trả, bị từ chối. Độc giả có thể tạo yêu cầu trả sách và gia hạn sách.

## Actor
Độc giả (đã đăng nhập)

## Yêu cầu
- Đã đăng nhập (Feature 2.1.2)
- Có vai trò Reader
- Đã có đơn mượn (Feature 2.3.1)

## Flowchart

```mermaid
flowchart TD
    Start([Độc giả đã đăng nhập]) --> ClickHistory[Click 'Lịch sử mượn sách']
    ClickHistory --> LoadBorrowHistory[Tải lịch sử mượn từ Database]
    
    LoadBorrowHistory --> CheckHasHistory{Có lịch sử mượn?}
    CheckHasHistory -->|Không| ShowNoHistory[Hiển thị: Bạn chưa mượn sách nào]
    ShowNoHistory --> ShowBrowseBooks[Hiển thị link: Duyệt sách]
    ShowBrowseBooks --> End([Kết thúc])
    
    CheckHasHistory -->|Có| DisplayTabs[Hiển thị 4 tabs:<br/>- Đang mượn<br/>- Đã trả<br/>- Chờ xác nhận<br/>- Bị từ chối]
    
    DisplayTabs --> UserSelectTab{Độc giả chọn tab}
    
    %% ============ TAB: ĐANG MƯỢN ============
    UserSelectTab -->|Tab 'Đang mượn'| LoadBorrowing[Tải danh sách sách đang mượn<br/>Status = 'Đang mượn' OR 'Quá hạn']
    LoadBorrowing --> DisplayBorrowing[Hiển thị mỗi sách:<br/>- Tên sách, Tác giả<br/>- Ngày mượn<br/>- Ngày hết hạn<br/>- Số ngày còn lại/quá hạn<br/>- Badge trạng thái]
    
    DisplayBorrowing --> BorrowingAction{Độc giả chọn}
    
    BorrowingAction -->|Click 'Xin trả sách'| ClickReturn[Click nút 'Xin trả sách']
    ClickReturn --> CheckReturnRequest{Đã có yêu cầu trả<br/>chờ xác nhận?}
    CheckReturnRequest -->|Có| ErrorAlreadyRequested[Hiển thị lỗi:<br/>Bạn đã gửi yêu cầu trả sách này<br/>Đang chờ nhân viên xác nhận]
    ErrorAlreadyRequested --> BorrowingAction
    CheckReturnRequest -->|Chưa| ShowReturnConfirm[Hiển thị modal xác nhận trả sách]
    
    ShowReturnConfirm --> ReturnConfirmChoice{Độc giả chọn}
    ReturnConfirmChoice -->|Hủy| BorrowingAction
    ReturnConfirmChoice -->|Xác nhận| CreateReturnRequest[Tạo yêu cầu trả sách<br/>Status = 'Chờ xác nhận']
    CreateReturnRequest --> SaveReturnRequest[(Lưu yêu cầu vào Database)]
    SaveReturnRequest --> NotifyStaff[Gửi thông báo cho nhân viên thư viện]
    NotifyStaff --> ShowReturnSuccess[Hiển thị thành công:<br/>Yêu cầu trả sách đã gửi<br/>Vui lòng mang sách đến thư viện]
    ShowReturnSuccess --> RefreshHistory1[Refresh lịch sử]
    RefreshHistory1 --> DisplayBorrowing
    
    BorrowingAction -->|Click 'Gia hạn'| ClickExtend[Click nút 'Gia hạn']
    ClickExtend --> CheckCanExtend{Kiểm tra điều kiện gia hạn}
    
    CheckCanExtend --> CheckAlreadyExtended{Đã gia hạn chưa?}
    CheckAlreadyExtended -->|Rồi| ErrorAlreadyExtended[Hiển thị lỗi:<br/>Sách này đã được gia hạn<br/>Tối đa 1 lần]
    ErrorAlreadyExtended --> BorrowingAction
    CheckAlreadyExtended -->|Chưa| CheckOverdue{Đã quá hạn?}
    
    CheckOverdue -->|Rồi| ErrorOverdue[Hiển thị lỗi:<br/>Không thể gia hạn sách quá hạn<br/>Vui lòng trả sách]
    ErrorOverdue --> BorrowingAction
    CheckOverdue -->|Chưa| CheckUnpaidFines{Có phạt chưa thanh toán?}
    
    CheckUnpaidFines -->|Có| ErrorFinesExtend[Hiển thị lỗi:<br/>Vui lòng thanh toán phạt<br/>trước khi gia hạn]
    ErrorFinesExtend --> BorrowingAction
    CheckUnpaidFines -->|Không| ShowExtendConfirm[Hiển thị modal xác nhận gia hạn<br/>Thêm 7 ngày<br/>Ngày hết hạn mới: X]
    
    ShowExtendConfirm --> ExtendChoice{Độc giả chọn}
    ExtendChoice -->|Hủy| BorrowingAction
    ExtendChoice -->|Xác nhận| UpdateDueDate[Cập nhật due_date += 7 ngày<br/>Set extended = true]
    UpdateDueDate --> SaveExtend[(Lưu vào Database)]
    SaveExtend --> ShowExtendSuccess[Hiển thị thành công:<br/>Gia hạn thành công<br/>Ngày hết hạn mới: X]
    ShowExtendSuccess --> RefreshHistory2[Refresh lịch sử]
    RefreshHistory2 --> DisplayBorrowing
    
    BorrowingAction -->|Xem chi tiết sách| RedirectDetail1[Chuyển đến trang chi tiết sách]
    RedirectDetail1 --> End
    
    BorrowingAction -->|Quay lại| DisplayTabs
    
    %% ============ TAB: ĐÃ TRẢ ============
    UserSelectTab -->|Tab 'Đã trả'| LoadReturned[Tải danh sách sách đã trả<br/>Status = 'Đã trả']
    LoadReturned --> DisplayReturned[Hiển thị mỗi sách:<br/>- Tên sách, Tác giả<br/>- Ngày mượn<br/>- Ngày trả thực tế<br/>- Số ngày mượn<br/>- Có phạt không?]
    
    DisplayReturned --> ReturnedAction{Độc giả chọn}
    ReturnedAction -->|Xem chi tiết| RedirectDetail2[Chuyển đến trang chi tiết sách]
    RedirectDetail2 --> End
    ReturnedAction -->|Mượn lại| RedirectBorrowAgain[Chuyển đến trang chi tiết sách<br/>với nút 'Mượn sách']
    RedirectBorrowAgain --> End
    ReturnedAction -->|Quay lại| DisplayTabs
    
    %% ============ TAB: CHỜ XÁC NHẬN ============
    UserSelectTab -->|Tab 'Chờ xác nhận'| LoadPending[Tải danh sách đơn chờ xác nhận<br/>Status = 'Chờ xác nhận']
    LoadPending --> DisplayPending[Hiển thị mỗi đơn:<br/>- Tên sách, Tác giả<br/>- Ngày tạo đơn<br/>- Ngày hết hạn dự kiến<br/>- Trạng thái: Chờ xác nhận]
    
    DisplayPending --> PendingAction{Độc giả chọn}
    PendingAction -->|Hủy đơn mượn| ClickCancelBorrow[Click 'Hủy đơn']
    ClickCancelBorrow --> ShowCancelConfirm[Hiển thị modal xác nhận hủy]
    ShowCancelConfirm --> CancelChoice{Độc giả chọn}
    CancelChoice -->|Không hủy| PendingAction
    CancelChoice -->|Xác nhận hủy| UpdateCanceled[Cập nhật status = 'Đã hủy']
    UpdateCanceled --> SaveCancel[(Lưu vào Database)]
    SaveCancel --> ShowCancelSuccess[Hiển thị: Đã hủy đơn mượn]
    ShowCancelSuccess --> RefreshHistory3[Refresh lịch sử]
    RefreshHistory3 --> DisplayPending
    PendingAction -->|Quay lại| DisplayTabs
    
    %% ============ TAB: BỊ TỪ CHỐI ============
    UserSelectTab -->|Tab 'Bị từ chối'| LoadRejected[Tải danh sách đơn bị từ chối<br/>Status = 'Bị từ chối']
    LoadRejected --> DisplayRejected[Hiển thị mỗi đơn:<br/>- Tên sách, Tác giả<br/>- Ngày tạo đơn<br/>- Lý do từ chối<br/>- Trạng thái: Bị từ chối]
    
    DisplayRejected --> RejectedAction{Độc giả chọn}
    RejectedAction -->|Xem lý do chi tiết| ShowReason[Hiển thị modal lý do từ chối đầy đủ]
    ShowReason --> RejectedAction
    RejectedAction -->|Mượn lại| RedirectBorrowAgain2[Chuyển đến trang chi tiết sách<br/>để mượn lại]
    RedirectBorrowAgain2 --> End
    RejectedAction -->|Quay lại| DisplayTabs
    
    DisplayTabs --> End
```

## Display Information

### Tab: Đang Mượn
```json
{
  "book_title": "string",
  "author": "string",
  "book_image": "URL",
  "borrow_date": "date",
  "due_date": "date",
  "days_remaining": "number (positive = còn lại, negative = quá hạn)",
  "status": "Đang mượn | Quá hạn",
  "extended": "boolean",
  "can_extend": "boolean",
  "can_return": "boolean"
}
```

### Tab: Đã Trả
```json
{
  "book_title": "string",
  "author": "string",
  "borrow_date": "date",
  "return_date": "date",
  "days_borrowed": "number",
  "was_late": "boolean",
  "fine_amount": "number (nullable)"
}
```

### Tab: Chờ Xác Nhận
```json
{
  "book_title": "string",
  "author": "string",
  "request_date": "date",
  "expected_due_date": "date",
  "status": "Chờ xác nhận",
  "can_cancel": "boolean"
}
```

### Tab: Bị Từ Chối
```json
{
  "book_title": "string",
  "author": "string",
  "request_date": "date",
  "rejection_reason": "string",
  "rejected_date": "date",
  "status": "Bị từ chối"
}
```

## Business Rules

### Gia Hạn Sách
1. ✅ Chưa quá hạn
2. ✅ Chưa gia hạn lần nào (tối đa 1 lần)
3. ✅ Không có phạt chưa thanh toán
4. ✅ Thêm 7 ngày vào `due_date`

### Tạo Yêu Cầu Trả Sách
1. ✅ Chưa có yêu cầu trả ở trạng thái "Chờ xác nhận"
2. ✅ Đơn mượn ở trạng thái "Đang mượn" hoặc "Quá hạn"

### Hủy Đơn Mượn
1. ✅ Đơn mượn ở trạng thái "Chờ xác nhận"
2. ✅ Chưa được nhân viên xác nhận

## Validation Rules

| Action | Condition | Message Error |
|--------|-----------|---------------|
| Gia hạn | Chưa gia hạn | "Sách này đã được gia hạn. Tối đa 1 lần" |
| Gia hạn | Chưa quá hạn | "Không thể gia hạn sách quá hạn" |
| Gia hạn | Không có phạt | "Vui lòng thanh toán phạt trước khi gia hạn" |
| Trả sách | Chưa có yêu cầu trả | "Bạn đã gửi yêu cầu trả sách này" |
| Hủy đơn | Đơn chờ xác nhận | "Không thể hủy đơn đã được xác nhận" |

## UI Features

### Badges
- 🟢 **Đang mượn** (còn > 3 ngày)
- 🟡 **Sắp hết hạn** (còn 1-3 ngày)
- 🔴 **Quá hạn** (đã quá due_date)
- ⚪ **Đã trả**
- 🔵 **Chờ xác nhận**
- 🔴 **Bị từ chối**

### Actions per Tab
| Tab | Available Actions |
|-----|------------------|
| Đang mượn | Xin trả sách, Gia hạn, Xem chi tiết |
| Đã trả | Xem chi tiết, Mượn lại |
| Chờ xác nhận | Hủy đơn, Xem chi tiết |
| Bị từ chối | Xem lý do, Mượn lại |

## Auto Status Update
- Đơn mượn tự động chuyển sang "Quá hạn" khi `now > due_date`
- Cập nhật real-time hoặc scheduled job

## Notifications
- Sắp hết hạn (2 ngày trước)
- Quá hạn (ngay khi quá hạn)
- Đơn được xác nhận/từ chối
- Yêu cầu trả được xác nhận

## Notes
- Tab mặc định là "Đang mượn"
- Hiển thị số lượng đơn ở mỗi tab (badge count)
- Có thể sort theo ngày (mới nhất/cũ nhất)
- Có thể search theo tên sách
- Responsive design cho mobile

