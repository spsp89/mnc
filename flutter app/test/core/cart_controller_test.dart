import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const product = Product(
    id: 'product-minimum',
    name: 'Local essentials pack',
    category: 'Grocery',
    price: 500,
    imageUrl: '',
    minimumOrderQty: 3,
  );

  test('cart starts at and enforces the backend minimum order quantity', () {
    final cart = CartController();

    cart.add(product);
    expect(cart.state.single.quantity, 3);

    cart.updateQuantity(product.id, 2);
    expect(cart.state.single.quantity, 3);

    cart.updateQuantity(product.id, 4);
    expect(cart.state.single.quantity, 4);
  });

  test('cart still allows an explicit product removal', () {
    final cart = CartController()..add(product);

    cart.updateQuantity(product.id, 0);

    expect(cart.state, isEmpty);
  });
}
