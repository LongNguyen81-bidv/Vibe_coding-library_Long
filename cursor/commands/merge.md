Tuân thủ quy trình merge an toàn. Merge branch hiện tại vào main đến khi hoàn thành commit.
Nếu có conflict, hỏi người dùng có muốn fix conflict hay không. Nếu có, sửa conflict tùy theo loại conflict gợi ý hướng giải quyết.

Quy trình merge tham khảo:

# 0. Kiểm tra working directory sạch
git status
# Nếu có uncommitted changes, hỏi người dùng:
# - git stash để tạm lưu thay đổi
# - hoặc git commit trước khi merge

# 1. Lấy thông tin branch hiện tại
git branch -v

# 2. Chuyển sang branch main và cập nhật code từ remote
git checkout main
git pull origin main

# 3. Merge branch hiện tại vào main
git merge branch-name

# 4. Kiểm tra xem có conflict hay không
git status                     
# Nếu có conflict, sửa các file conflict sau đó test ok thì cập nhật lại và commit:
git add .
git commit