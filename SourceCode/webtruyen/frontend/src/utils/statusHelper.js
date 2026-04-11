export const statusMap = {
  'ongoing': 'Đang cập nhật',
  'completed': 'Hoàn thành',
  'hiatus': 'Tạm dừng',
  'cancelled': 'Đã hủy'
};

export const getStatusLabel = (statusValue) => {
  return statusMap[statusValue] || statusValue;
};
