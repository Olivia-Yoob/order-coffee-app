import americanoHotImage from '../assets/americano-hot.png'
import americanoIceImage from '../assets/americano-ice.png'
import caffeLatteImage from '../assets/caffe-latte.png'

export const menuItems = [
  {
    id: 'americano-ice',
    name: '아메리카노(ICE)',
    price: 4000,
    image: americanoIceImage,
    description: '가볍고 산뜻한 아이스 아메리카노',
    options: [
      { id: 'shot', label: '샷 추가', price: 500 },
      { id: 'syrup', label: '시럽 추가', price: 0 },
    ],
  },
  {
    id: 'americano-hot',
    name: '아메리카노(HOT)',
    price: 4000,
    image: americanoHotImage,
    description: '진한 향을 담은 따뜻한 아메리카노',
    options: [
      { id: 'shot', label: '샷 추가', price: 500 },
      { id: 'syrup', label: '시럽 추가', price: 0 },
    ],
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    price: 5000,
    image: caffeLatteImage,
    description: '주인장 Yoob의 원픽 라떼',
    options: [
      { id: 'shot', label: '샷 추가', price: 500 },
      { id: 'syrup', label: '시럽 추가', price: 0 },
    ],
  },
]
