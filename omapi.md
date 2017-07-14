# Order Management API

## Revision History

### 0.5.0 (30 June 2017)

- First release

## Order Management API

### End-point

```http://192.168.1.14:2908```

### Resources

Resource | HTTP METHOD | Description
-------- | ------------ | ------------
[/ext/orders](#orders_post)|  POST   |  ทำการลงทะเบียนสิ่งของเพื่อเตรียมพร้อมการจ่าหน้า
[/ext/packs](#packs_post)|  POST   |  นำ order_no เข้าสู่การจ่าหน้า
[/ext/packs/:barcode](#packs_get)|  GET   |  รับรายละเอียดของการจ่าหน้า
[/version](#version_get)|  GET  |  ตรวจสอบ version ของ API server

<div class="page-break" />

<a id="orders_post"></a>
### ORDERS (POST)

Attribute | Description
-------- | ------------
URL | /ext/orders
HTTP METHOD | POST

#### HTTP BODY DATA
Params | DataType     |  Description
-------- | ------------ | ------------
ref_order | String   |  referenced order
items | Array   |  items ที่อยู่ใน orderอันประกอบด้วย <table><tr><td>Params</td><td>Datatype</td><td>Description</td></tr><tr><td>id</td><td>String</td><td>item id</td></tr><tr><td>name</td><td>String</td><td>ชื่อสินค้า</td></tr><tr><td>qty</td><td>Number</td><td>ปริมาณการสั่ง</td><tr><td>price</td><td>Decimal</td><td>ราคาสินค้า</td></tr></table>
recipient | Json object | รายละเอียดผู้รับ <table><tr><td>Params</td><td>Datatype</td><td>Description</td></tr><tr><td>first_name</td><td>String</td><td>ชื่อผู้รับ</td></tr><tr><td>last_name</td><td>String</td><td>นามสกุลผู้รับ</td></tr><tr><td>postal_code</td><td>String</td><td>รหัสไปรษณีย์ผู้รับ</td><tr><td>phone</td><td>String</td><td>หมายเลขโทรศัพท์</td></tr><tr><td>address</td><td>String</td><td>ที่อยู่ผู้รับ</td></tr></table>
sender | Json object | รายละเอียดผู้ส่ง <table><tr><td>Params</td><td>Datatype</td><td>Description</td></tr><tr><td>first_name</td><td>String</td><td>ชื่อผู้ส่ง</td></tr><tr><td>last_name</td><td>String</td><td>นามสกุลผู้ส่ง</td></tr><tr><td>postal_code</td><td>String</td><td>รหัสไปรษณีย์ผู้ส่ง</td><tr><td>phone</td><td>String</td><td>หมายเลขโทรศัพท์ผู้ส่ง</td></tr><tr><td>address</td><td>String</td><td>ที่อยู่ผู้ส่ง</td></tr></table>

#### Request example
```json
{
  "ref_order": "1234567890",
  "items": [{
   "id": 1,
   "name": "Quos faucibus",
   "qty": 3,
   "price": 300.00
  }, {
   "id": 2,
   "name": "Ad in suspendisse",
   "qty": 1,
   "price": 100.00
  }],
  "recipient": {
   "first_name": "John",
   "last_name": "Cobra",
   "postal_code": "10220",
   "phone": "0826480485",
   "address": "200 Moo 4, 18th Floor, Jasmine International Tower, Chaengwattana Road, Pakkret, Nonthaburi"
  },
  "sender": {
   "first_name": "Jim",
   "last_name": "Python",
   "postal_code": "10230",
   "phone": "0812594918",
   "address": "78/108 City Sense, Watcharapol Road, Bangkhen, Bangkok"
  }
}
```
#### Response example (Success)
```json
{
  "order_no": "17062900013"
}
```

#### Response example (Error)
```json
{
  "error": {
      "message": "Packaging at least 1 required."
  }
}
```
<div class="page-break" />

<a id="packs_post"></a>
### PACKS (POST)

Attribute | Description
-------- | ------------
URL | /ext/packs
HTTP METHOD | POST

#### HTTP BODY DATA
Params | DataType     |  Description
-------- | ------------ | ------------
order_no | String   |  order_no ที่ได้รับจาก /ext/orders
weight | Number   |  น้ำหนักของสิ่งของ (หน่วยเป็นกรัม)
service_type | Number |  ประเภทบริการ ต้องเป็นค่า 2572 (EMS), 2639 (ลงทะเบียนในประเทศ), 2579 (พัสดุในประเทศ)
items | Array   |  items ที่จะทำการบรรจุประกอบด้วย <table><tr><td>Params</td><td>Datatype</td><td>Description</td></tr><tr><td>id</td><td>String</td><td>item id</td></tr><tr><td>name</td><td>String</td><td>ชื่อสินค้า</td></tr><tr><td>qty</td><td>Number</td><td>ปริมาณสินค้า</td></tr></table>

#### Request example
```json
{
 "order_no": "17062900013",
 "weight": 5000,
 "service_type": 2572,
 "items": [{
     "id": 1,
     "name": "Quos faucibus",
     "qty": 2
    }]
}
```
#### Response example (Success)
```json
{
    "barcode": "EP983005538TH",
    "price": 217.00,
    "weight": 5000,
    "service": {
        "name": "ด่วนพิเศษในประเทศ (EMS)",
        "type": 2572
    },
    "recipient": {
        "first_name": "John",
        "last_name": "Cobra",
        "postal_code": "10220",
        "phone": "0826480485",
        "address": "200 Moo 4, 18th Floor, Jasmine International Tower, Chaengwattana Road, Pakkret, Nonthaburi"
    },
    "sender": {
        "first_name": "Jim",
        "last_name": "Python",
        "postal_code": "10230",
        "phone": "0826480485",
        "address": "78/108 City Sense, Watcharapol Road, Bangkhen, Bangkok"
    }
}
```

#### Response example (Error)
```json
{
  "error": {
      "message": "Packaging at least 1 required."
  }
}
```
<div class="page-break" />

<a id="packs_get"></a>
### PACKS (GET)

Attribute | Description
-------- | ------------
URL | /ext/packs/:barcode
HTTP METHOD | GET

#### Request example
```json
http://192.168.1.14:2908/ext/packs/EP983005467TH
```
#### Response example (Success)
```json
{
    "barcode": "EP983005467TH",
    "price": 217.00,
    "weight": 5000,
    "service": {
        "name": "ด่วนพิเศษในประเทศ (EMS)",
        "type": 2572
    },
    "recipient": {
        "first_name": "John",
        "last_name": "Cobra",
        "postal_code": "10220",
        "phone": "0826480485",
        "address": "200 Moo 4, 18th Floor, Jasmine International Tower, Chaengwattana Road, Pakkret, Nonthaburi"
    },
    "sender": {
        "first_name": "Chanon",
        "last_name": "Trising",
        "postal_code": "10230",
        "phone": "0826480485",
        "address": "78/108 City Sense, Watcharapol Road, Bangkhen, Bangkok"
    }
}
```

#### Response example (Error)
```json
{
  "error": {
      "message": "Data not found"
  }
}
```

<div class="page-break" />

<a id="version_get"></a>
### VERSION (GET)

Attribute | Description
-------- | ------------
URL | /version
HTTP METHOD | GET

#### Request example
```json
http://192.168.1.14:2908/version
```
#### Response example (Success)
```json
{
    "version": "0.5.0"
}
```
