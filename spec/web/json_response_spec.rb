require 'json'
require 'spec_helper'

RSpec.describe TextAdventures::Web::JsonResponse do
  it "formats successful JSON responses" do
    response = described_class.success({ ok: true }, status: 201)

    expect(response.status).to eq 201
    expect(response.headers).to eq "Content-Type" => "application/json"
    expect(JSON.parse(response.json)).to eq "ok" => true
    expect(response.to_rack).to eq [201, { "Content-Type" => "application/json" }, ['{"ok":true}']]
  end

  it "formats error JSON responses" do
    response = described_class.error("not_found", "Game not found.", status: 404)

    expect(response.status).to eq 404
    expect(JSON.parse(response.json)).to eq(
      "error" => {
        "code" => "not_found",
        "message" => "Game not found."
      }
    )
  end

  it "formats empty no-content responses" do
    response = described_class.no_content

    expect(response.status).to eq 204
    expect(response.json).to eq ""
  end
end
