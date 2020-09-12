require 'spec_helper'

RSpec.describe Extent do
  subject(:extent) { described_class.new current, **attributes }

  let(:current) { 10 }
  let(:attributes) { {max: 50, min: 0, overload: 0} }

  describe ".new" do
    it "return a new object" do
      expect(extent).to be_a Extent
    end

    it { is_expected.to have_attributes attributes }

    it "if max is missing using the current value" do
      expect(described_class.new(10)).to have_attributes max: 10
    end
  end

  describe "sum operation" do
    context "when sum is less than max" do
      subject(:result) { extent + a_number }

      let(:a_number) { rand(attributes[:max] - current) }

      it "return an extent with the sum as current" do
        expect(result).to have_attributes(current: (current + a_number), overload: 0)
      end
    end

    context "when sum is greater than max" do
      subject(:subject) { extent + a_number }

      let(:a_number) { rand(10) + 1 + attributes[:max] } # rand can return 0
      let(:overflowed) { a_number - (attributes[:max] - current) }

      it "return an extent with max as current and the diff as overload" do
        expect(subject).to have_attributes(current: attributes[:max], overload: overflowed)
      end
    end
  end

  describe "subtraction operation" do
    context "when subtraction is more than min" do
      subject(:result) { extent - value }

      let(:value) { rand(current - attributes[:min]) }

      it "return an extent with the subtraction as current" do
        expect(result).to have_attributes(current: current - value, overload: 0)
      end
    end

    context "when subtraction is less than min" do
      subject(:result) { extent - value }

      let(:attributes) { {min: 0} }
      let(:overloaded) { value - current }
      let(:value) { rand(10) + 1 + current } # rand can return 0

      it "return an extent with min as current and diff as overload" do
        expect(result).to have_attributes(current: attributes[:min], overload: overloaded)
      end
    end
  end

  describe "#current" do
    it { is_expected.to have_attributes(current: current) }
  end

  describe "#max" do
    it { is_expected.to have_attributes(max: attributes[:max]) }
  end

  describe "#max?" do
    it { is_expected.to have_attributes(max?: false) }

    it "return true when current is equal max" do
      expect(described_class.new(10, max: 10)).to be_max
    end
  end

  describe "#min" do
    it { is_expected.to have_attributes(min: attributes[:min]) }
  end

  describe "#min?" do
    it { is_expected.to have_attributes(min?: false) }

    it "return true when current is equal min" do
      expect(described_class.new(1, min: 1)).to be_min
    end
  end

  describe "#overloaded" do
    let(:attributes) { {overload: 2} }

    it { is_expected.to have_attributes(overload: attributes[:overload]) }
  end

  describe "#overloaded?" do
    context "when overloaded" do
      let(:attributes) { {overload: 2} }

      it { is_expected.to be_overloaded }
    end

    context "when not overloaded" do
      it { is_expected.to_not be_overloaded }
    end
  end


  context "comparison operators" do
    let(:lt) { current - 1 }
    let(:gt) { current + 1 }

    it { is_expected.to be > lt }
    it { is_expected.to be < gt }

    it { is_expected.to be == current }
    it { is_expected.to_not be == lt }

    context "sorting" do
      it "can be sorted against a number" do
        expect(extent <=> lt).to be 1
        expect(extent <=> current).to be 0
        expect(extent <=> gt).to be -1
      end
    end

    it "raise error when can't compare" do
      expect { extent > "a" }.to raise_exception(ArgumentError, "comparison of Integer with String failed")
    end
  end

end
