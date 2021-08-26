const DataObject = rootRequire('models/data-object')

const airtableView = 'Order Items'

class OrderItem extends DataObject {
  constructor(item) {
    super()
    this.init(item)
  }

  static get airtableView() {
    return airtableView
  }

  get name() {
    return this._name
  }

  set name(name) {
    this._name = name
  }

  get sku() {
    return this._sku
  }

  set sku(sku) {
    this._sku = sku
  }

  get image() {
    return this._image
  }

  set image(image) {
    this._image = image.length ? image[0] : ''
  }

  get price() {
    return this._price
  }

  set price(price) {
    this._price = price / 100
  }

  get qty() {
    return this._qty
  }

  set qty(qty) {
    this._qty = qty
  }

  get acceptSubstitute() {
    return this._accept_substitute
  }

  set acceptSubstitute(acceptSubstitute) {
    this._accept_substitute = acceptSubstitute == 1 || acceptSubstitute === 'true' ? true : false
  }

  get options() {
    return this._options
  }

  set options(options) {
    this._options = options
  }

  init(item) {
    const product = item.price.product

    this.name = product.name
    this.sku = product.metadata.sku
    this.image = product.images
    this.price = item.price.unit_amount
    this.qty = item.quantity
    this.acceptSubstitute = product.metadata.accept_substitute
    this.options = product.metadata.options
  }
}

module.exports = OrderItem
